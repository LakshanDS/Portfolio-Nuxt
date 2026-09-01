// Registration status check.
// Returns the TOTP QR code (rendered server-side via qrcode) plus a
// CSRF token, and persists the pending secret as an unverified User row in D1.

import { TOTP } from "otpauth";
import { renderSVG } from "uqr";

export default defineEventHandler(async (event) => {
  try {
    const db = useDb(event);
    const user = await db.prepare(`SELECT * FROM User WHERE isRegistered = 1 LIMIT 1`).first();

    if (!user) {
      // No registered user - generate new TOTP secret for registration.
      // The pending secret is stored as an unverified User row in D1 so it
      // survives across Workers isolates (the old in-memory Map did not).
      const totp = new TOTP({
        issuer: "Portfolio Admin",
        label: "Admin",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      });

      const secret = totp.secret.base32;
      const otpauthUrl = totp.toString();

      // uqr renders pure SVG — the old `qrcode` package crashes on Workers
      // (its pngjs dependency uses util.inherits, unsupported by nodejs_compat)
      const svg = renderSVG(otpauthUrl, { border: 2 });
      const qrCodeUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

      // Replace any stale pending rows, then create a fresh one
      await db.prepare(`DELETE FROM User WHERE isRegistered = 0`).first();
      const tempId = crypto.randomUUID();
      const now = new Date().toISOString();
      await db
        .prepare(`INSERT INTO User (id, secret, isRegistered, createdAt, updatedAt) VALUES (?, ?, 0, ?, ?)`)
        .bind(tempId, secret, now, now)
        .first();

      // Generate CSRF token
      const { token: csrfToken, cookieHeader } = createCSRFTokenCookie();

      // Set CSRF token cookie
      setHeader(event, "Set-Cookie", cookieHeader);

      return {
        isRegistered: false,
        qrCodeUrl,
        tempId, // Send tempId instead of secret
        secret, // Send secret for manual entry
        csrfToken,
      };
    }

    // User exists - generate CSRF token for login form
    const { token: csrfToken, cookieHeader } = createCSRFTokenCookie();

    setHeader(event, "Set-Cookie", cookieHeader);

    return {
      isRegistered: true,
      csrfToken,
    };
  } catch (error) {
    console.error("Registration check error:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to check registration status" };
  }
});
