/**
 * CSRF (Cross-Site Request Forgery) protection utilities
 * Web Crypto only — runs on Cloudflare Workers and Node.
 */

/**
 * Generates a cryptographically secure CSRF token
 * @returns A 64-character hex string
 */
export function generateCSRFToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time string comparison (guards against timing attacks)
 * @param a First string
 * @param b Second string
 * @returns true if strings are equal, false otherwise
 */
export function timingSafeEqual(a: string, b: string): boolean {
  // Length check first (cheap), then constant-time comparison
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Validates a CSRF token against the stored token
 * @param token The token to validate
 * @param storedToken The stored token to compare against
 * @returns true if tokens match, false otherwise
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
  return timingSafeEqual(token, storedToken);
}

/**
 * Generates a CSRF token and stores it in a cookie
 * @param cookieName The name of the cookie to store the token in
 * @returns The CSRF token and the cookie header
 */
export function createCSRFTokenCookie(cookieName: string = "csrf_token") {
  const token = generateCSRFToken();

  // `Secure` is a bare flag — emit it only in production (dev runs over http)
  const secureFlag = process.env.NODE_ENV === "production" ? " Secure;" : "";
  const cookieHeader = `${cookieName}=${token}; HttpOnly;${secureFlag} SameSite=Strict; Path=/; Max-Age=3600`; // 1 hour

  return {
    token,
    cookieHeader,
  };
}
