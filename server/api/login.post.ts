// Verifies the TOTP code
// (first-time registration or regular login), rate-limited per IP via D1.

import { TOTP } from "otpauth";

const TEMP_SECRET_DURATION = 5 * 60 * 1000; // 5 minutes

export default defineEventHandler(async (event) => {
  try {
    // JSON.parse the raw body directly — empty/invalid input throws
    // into the catch below (500)
    const { code, tempId, csrfToken } = JSON.parse((await readRawBody(event, "utf8")) ?? "") as {
      code?: string;
      tempId?: string;
      csrfToken?: string;
    };

    // Get client IP for rate limiting
    const ip =
      getHeader(event, "cf-connecting-ip") ||
      getHeader(event, "x-forwarded-for") ||
      getHeader(event, "x-real-ip") ||
      "unknown";

    const userAgent = getHeader(event, "user-agent") || undefined;

    // Validate CSRF token
    const storedCSRFToken = getCookie(event, "csrf_token");

    if (!csrfToken || !storedCSRFToken || !validateCSRFToken(csrfToken, storedCSRFToken)) {
      logCSRFValidationFailed(ip, userAgent);
      setResponseStatus(event, 403);
      return { success: false, error: "Invalid CSRF token" };
    }

    // Validate OTP code format
    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      logLoginFailure(ip, "Invalid OTP format", userAgent);
      setResponseStatus(event, 400);
      return { success: false, error: "Invalid OTP code" };
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(event, ip);

    if (!rateLimitResult) {
      logRateLimitExceeded(ip);
      const resetTime = await getRateLimitResetTime(event, ip);
      setResponseStatus(event, 429);
      return {
        success: false,
        error: "Too many failed attempts. Please try again later.",
        resetTime,
      };
    }

    const db = useDb(event);
    const user = await db.prepare(`SELECT * FROM User WHERE isRegistered = 1 LIMIT 1`).first();

    if (!user) {
      // First time registration - verify against pending secret row
      if (!tempId) {
        setResponseStatus(event, 400);
        return { success: false, error: "Registration session expired. Please refresh." };
      }

      const pendingUser = await db.prepare(`SELECT * FROM User WHERE id = ?`).bind(tempId).first();

      const expired =
        !pendingUser ||
        Boolean(pendingUser.isRegistered) ||
        Date.now() - new Date(pendingUser.createdAt as string).getTime() > TEMP_SECRET_DURATION;

      if (expired) {
        if (pendingUser && !pendingUser.isRegistered) {
          try {
            await db.prepare(`DELETE FROM User WHERE id = ?`).bind(tempId).first();
          } catch {
            // ignore cleanup failures
          }
        }
        setResponseStatus(event, 400);
        return { success: false, error: "Registration session expired. Please refresh." };
      }

      // Verify OTP against temp secret
      const totp = new TOTP({
        issuer: "Portfolio Admin",
        label: "Admin",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: pendingUser.secret as string,
      });

      const delta = totp.validate({ token: code, window: 1 });

      if (delta === null) {
        logLoginFailure(ip, "Invalid OTP during registration", userAgent);
        const remaining = await getRemainingAttempts(event, ip);
        setResponseStatus(event, 401);
        return {
          success: false,
          error: "Invalid OTP code",
          remainingAttempts: remaining,
        };
      }

      // OTP is valid - mark the pending row as the registered user
      const newUserId = pendingUser.id as string;
      await db
        .prepare(`UPDATE User SET isRegistered = 1, updatedAt = ? WHERE id = ?`)
        .bind(new Date().toISOString(), newUserId)
        .first();

      // Create session
      const session = await createSession(newUserId, event);

      // Set session cookie
      setHeader(event, "Set-Cookie", await setSessionCookie(session));

      // Log successful login
      logLoginSuccess(newUserId, ip, userAgent);

      // Reset rate limit
      await resetRateLimit(event, ip);

      return {
        success: true,
        message: "Registration complete! You are now logged in.",
      };
    }

    // User exists - verify OTP against stored secret
    const totp = new TOTP({
      issuer: "Portfolio Admin",
      label: "Admin",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: user.secret as string,
    });

    const delta = totp.validate({ token: code, window: 1 });

    if (delta === null) {
      logLoginFailure(ip, "Invalid OTP during login", userAgent);
      const remaining = await getRemainingAttempts(event, ip);
      setResponseStatus(event, 401);
      return {
        success: false,
        error: "Invalid OTP code",
        remainingAttempts: remaining,
      };
    }

    // OTP is valid - create session
    const session = await createSession(user.id as string, event);

    // Set session cookie
    setHeader(event, "Set-Cookie", await setSessionCookie(session));

    // Log successful login
    logLoginSuccess(user.id as string, ip, userAgent);

    // Reset rate limit
    await resetRateLimit(event, ip);

    return {
      success: true,
      message: "Login successful",
    };
  } catch (error) {
    console.error("Login error:", error);
    setResponseStatus(event, 500);
    return { success: false, error: "Login failed" };
  }
});
