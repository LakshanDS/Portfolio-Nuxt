// Protects /jasladmin/** except /jasladmin/login.
// The admin_session cookie is verified server-side (expiry + HMAC signature
// via SESSION_SECRET). The signature secret can't run in the browser, so the
// guard asks /api/session/check, which enforces expiry + signature on the
// server with the same rules, and redirects to the login page on any failure.
// Only /jasladmin/* routes are guarded; all others pass through.

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith("/jasladmin/")) return;

  // Allow the login page (and /jasladmin itself) through
  if (to.path === "/jasladmin/login") return;

  try {
    // useRequestFetch forwards the browser cookies to the internal API call
    // during SSR — the server sees the raw request
    const check = await useRequestFetch()<{ authenticated?: boolean }>("/api/session/check");
    if (!check?.authenticated) {
      return navigateTo("/jasladmin/login");
    }
  } catch {
    // 401 (missing/expired/forged cookie) or error → login
    return navigateTo("/jasladmin/login");
  }
});
