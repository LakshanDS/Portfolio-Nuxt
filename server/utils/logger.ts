// Debug logging for the run console (terminal / `wrangler tail`) — never the
// browser console. Enabled with LOG_DEBUG=1 (or true) in the environment.
// NB: process.env.DEBUG is reserved by nitro (statically inlined at build).
export function isDebug(): boolean {
  const value = String(process.env.LOG_DEBUG ?? "").toLowerCase();
  return value === "1" || value === "true";
}

export function logDebug(...args: unknown[]): void {
  if (isDebug()) console.log("[debug]", ...args);
}
