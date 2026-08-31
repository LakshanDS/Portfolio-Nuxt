// HMAC-signed admin_session cookie.
// Cookies are read off the h3 event.

import type { H3Event } from "h3";

export const SESSION_COOKIE_NAME = "admin_session";
export const SESSION_DURATION = 10 * 60 * 1000; // 10 minutes

export interface Session {
  userId: string;
  token: string;
  expiresAt: number;
  signature: string;
}

// Crypto-random token — Math.random() is predictable, and the token IS the
// session credential
function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Fail closed: a missing secret must never silently fall back to a known
// string — that would let anyone forge admin cookies. Workers exposes secrets
// on process.env (nodejs_compat); dev gets it from .env / .dev.vars.
function getSessionSecret(event?: H3Event): string {
  const fromBinding = (event?.context as { cloudflare?: { env?: Record<string, unknown> } } | undefined)
    ?.cloudflare?.env?.SESSION_SECRET as string | undefined;
  const secret = fromBinding || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not configured — set it with `wrangler secret put SESSION_SECRET` (prod) or in .dev.vars (dev)",
    );
  }
  return secret;
}

/**
 * Signs a session with HMAC-SHA256 using Web Crypto API
 * @param session Session object without signature
 * @returns Hex signature string
 */
async function signSession(
  session: Omit<Session, "signature">,
  event?: H3Event,
): Promise<string> {
  const secret = getSessionSecret(event);
  const data = `${session.userId}:${session.token}:${session.expiresAt}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const dataBytes = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, dataBytes);

  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Creates a new session with a 10-minute sliding expiration
 * @param userId User ID to associate with the session
 * @returns Session object
 */
export async function createSession(userId: string, event?: H3Event): Promise<Session> {
  const token = generateToken();
  const expiresAt = Date.now() + SESSION_DURATION;

  const sessionWithoutSignature = {
    userId,
    token,
    expiresAt,
  };

  const signature = await signSession(sessionWithoutSignature, event);

  return { ...sessionWithoutSignature, signature };
}

/**
 * Retrieves the current session from cookies (named getAdminSession —
 * h3 auto-imports its own unrelated getSession)
 * @returns Session object if valid and not expired, otherwise null
 */
export async function getAdminSession(event: H3Event): Promise<Session | null> {
  const sessionCookie = getCookie(event, SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    // h3's getCookie already URI-decodes, like Next's cookies()
    const session: Session = JSON.parse(sessionCookie);

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      return null;
    }

    // Verify session signature (constant-time, like the CSRF compare)
    const expectedSignature = await signSession(
      {
        userId: session.userId,
        token: session.token,
        expiresAt: session.expiresAt,
      },
      event,
    );

    if (!timingSafeEqual(session.signature, expectedSignature)) {
      console.warn("[SECURITY] Session signature verification failed");
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Renews the session with a fresh 10-minute expiration
 * @returns Renewed session or null if no active session
 */
export async function renewSession(event: H3Event): Promise<Session | null> {
  const session = await getAdminSession(event);
  if (!session) {
    return null;
  }

  return createSession(session.userId, event);
}

/**
 * Gets the remaining session time in minutes
 * @returns Remaining minutes or 0 if no active session
 */
export async function getSessionTimeRemaining(event: H3Event): Promise<number> {
  const session = await getAdminSession(event);
  if (!session) {
    return 0;
  }

  const remaining = session.expiresAt - Date.now();
  return Math.max(0, Math.floor(remaining / 60000)); // Convert to minutes
}

/**
 * Sets the session cookie
 * @param session Session object to store
 * @returns Cookie string to set
 */
export async function setSessionCookie(session: Session): Promise<string> {
  // `Secure` is a bare flag — emit it only in production (dev runs over http)
  const secureFlag = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(session),
  )}; HttpOnly;${secureFlag} SameSite=lax; Path=/; Max-Age=${SESSION_DURATION / 1000}`;
}

/**
 * Clears the session cookie
 * @returns Cookie string to clear
 */
export function clearSessionCookie(): string {
  const secureFlag = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${SESSION_COOKIE_NAME}=; HttpOnly;${secureFlag} SameSite=lax; Path=/; Max-Age=0`;
}

/**
 * Authentication guard for API routes
 * Returns null if authenticated, or the 401 response body to return
 */
export async function requireAuth(event: H3Event): Promise<{ error: string } | null> {
  const session = await getAdminSession(event);

  if (!session) {
    setResponseStatus(event, 401);
    return { error: "Unauthorized - Authentication required" };
  }

  return null; // Auth successful
}
