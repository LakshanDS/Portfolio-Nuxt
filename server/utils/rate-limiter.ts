// Rate limiting for login attempts, backed by D1 so limits hold across
// Cloudflare Workers isolates. Limits to 5 failed attempts per IP in 15 minutes.

import type { H3Event } from "h3";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

type Attempt = { count: number; resetAt: Date };

async function getAttempt(event: H3Event, ip: string): Promise<Attempt | null> {
  const db = useDb(event);
  const row = await db.prepare(`SELECT count, resetAt FROM LoginAttempt WHERE ip = ?`).bind(ip).first();
  if (!row) return null;
  const resetAt = new Date(row.resetAt as string).getTime();
  if (resetAt <= Date.now()) return null;
  return { count: Number(row.count), resetAt: new Date(resetAt) };
}

/**
 * Checks if an IP address has exceeded the rate limit
 * @param event h3 event (for the D1 binding)
 * @param ip The IP address to check
 * @returns true if allowed, false if rate limited
 */
export async function checkRateLimit(event: H3Event, ip: string): Promise<boolean> {
  const db = useDb(event);
  const existing = await getAttempt(event, ip);

  const windowEnd = new Date(Date.now() + WINDOW_MS).toISOString();
  const now = new Date().toISOString();

  if (!existing) {
    // no row yet, or the previous window expired — start a fresh window
    await db
      .prepare(
        `INSERT INTO LoginAttempt (id, ip, count, resetAt, updatedAt)
         VALUES (?, ?, 1, ?, ?)
         ON CONFLICT(ip) DO UPDATE SET count = 1, resetAt = excluded.resetAt, updatedAt = excluded.updatedAt`,
      )
      .bind(crypto.randomUUID(), ip, windowEnd, now)
      .first();
    return true;
  }

  if (existing.count >= MAX_ATTEMPTS) {
    return false;
  }

  await db
    .prepare(`UPDATE LoginAttempt SET count = count + 1, updatedAt = ? WHERE ip = ?`)
    .bind(now, ip)
    .first();
  return true;
}

/**
 * Resets the rate limit for an IP address
 * Call this after a successful login
 * @param event h3 event (for the D1 binding)
 * @param ip The IP address to reset
 */
export async function resetRateLimit(event: H3Event, ip: string) {
  const db = useDb(event);
  await db.prepare(`DELETE FROM LoginAttempt WHERE ip = ?`).bind(ip).first();
}

/**
 * Gets the remaining time until rate limit resets
 * @param event h3 event (for the D1 binding)
 * @param ip The IP address to check
 * @returns Remaining time in seconds, or 0 if not rate limited
 */
export async function getRateLimitResetTime(event: H3Event, ip: string): Promise<number> {
  const existing = await getAttempt(event, ip);
  if (!existing) {
    return 0;
  }
  const remaining = existing.resetAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * Gets the number of remaining attempts for an IP
 * @param event h3 event (for the D1 binding)
 * @param ip The IP address to check
 * @returns Remaining attempts, or MAX_ATTEMPTS if not rate limited
 */
export async function getRemainingAttempts(event: H3Event, ip: string): Promise<number> {
  const existing = await getAttempt(event, ip);
  if (!existing) {
    return MAX_ATTEMPTS;
  }
  return Math.max(0, MAX_ATTEMPTS - existing.count);
}

/**
 * Generic key-based rate limit for public endpoints (comments, visit
 * tracking) — separate RateLimit table so login semantics stay untouched.
 * @param event h3 event (for the D1 binding)
 * @param key Unique key, e.g. `comment:<ip>`
 * @param max Allowed attempts per window
 * @param windowMs Window length in milliseconds
 * @returns true if allowed, false if rate limited
 */
export async function checkKeyRateLimit(
  event: H3Event,
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const db = useDb(event);
  const row = await db
    .prepare(`SELECT count, resetAt FROM RateLimit WHERE "key" = ?`)
    .bind(key)
    .first();

  const windowEnd = new Date(Date.now() + windowMs).toISOString();
  const now = new Date().toISOString();

  if (!row || new Date(row.resetAt as string).getTime() <= Date.now()) {
    // no row yet, or the previous window expired — start a fresh window
    await db
      .prepare(
        `INSERT INTO RateLimit ("key", count, resetAt, updatedAt)
         VALUES (?, 1, ?, ?)
         ON CONFLICT("key") DO UPDATE SET count = 1, resetAt = excluded.resetAt, updatedAt = excluded.updatedAt`,
      )
      .bind(key, windowEnd, now)
      .first();
    return true;
  }

  if ((row.count as number) >= max) {
    return false;
  }

  await db
    .prepare(`UPDATE RateLimit SET count = count + 1, updatedAt = ? WHERE "key" = ?`)
    .bind(now, key)
    .first();
  return true;
}
