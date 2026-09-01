/**
 * Visit tracking. On Cloudflare, geolocation comes free with the request
 * (request.cf.country / request.cf.city) — no external IP lookup needed.
 */

interface GeoLocationData {
  country: string;
  city: string;
}

async function getRequestLocation(event: any): Promise<GeoLocationData | null> {
  try {
    // Cloudflare request properties (nitro sets event.context.cf on Workers
    // and via the wrangler proxy in dev)
    const cf = event.context.cf as { country?: string; city?: string } | undefined;
    if (cf?.country) {
      return {
        country: cf.country,
        city: cf.city || "",
      };
    }
  } catch {
    // ignore
  }

  // Fallback for non-Cloudflare hosting: external IP lookup
  const forwarded = getHeader(event, "x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : null;
  if (!ip || ip === "127.0.0.1" || ip === "::1") return null;

  try {
    const data = await $fetch<{ status: string; country: string; city: string }>(
      `https://ip-api.com/json/${ip}?fields=status,country,city`,
    );
    if (data.status === "success") {
      return {
        country: data.country,
        city: data.city || "",
      };
    }
  } catch (error) {
    console.warn("Failed to get IP location:", error);
  }
  return null;
}

function getClientIp(event: any): string | null {
  const cfConnectingIp = getHeader(event, "cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  const forwarded = getHeader(event, "x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    return ips[0] || null;
  }

  const realIp = getHeader(event, "x-real-ip");
  if (realIp) return realIp;

  return null;
}

export default defineEventHandler(async (event) => {
  try {
    const text = (await readRawBody(event, "utf-8")) || "";
    if (!text) {
      return { success: true };
    }

    let body: { path?: string };
    try {
      body = JSON.parse(text);
    } catch {
      return { success: true };
    }

    const { path } = body;
    const date = new Date().toISOString().split("T")[0];
    const ipAddress = getClientIp(event) || "unknown";

    // Row-fill guard — bounded writes per IP (endpoint is public)
    if (!(await checkKeyRateLimit(event, `visit:${ipAddress}`, 120, 10 * 60 * 1000))) {
      return { success: true };
    }

    let country: string | null = null;
    let city: string | null = null;

    const location = await getRequestLocation(event);
    if (location) {
      country = location.country;
      city = location.city || null;
    }

    const db = useDb(event);
    await db
      .prepare(
        `INSERT INTO "PageVisit" ("id", "path", "date", "count", "country", "city", "ipAddress", "createdAt", "updatedAt")
         VALUES (?, ?, ?, 1, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT ("ipAddress", "path", "date") DO UPDATE SET "count" = "count" + 1, "updatedAt" = CURRENT_TIMESTAMP`,
      )
      .bind(crypto.randomUUID(), path || "/", date, country, city, ipAddress)
      .first();

    return { success: true };
  } catch (error) {
    console.warn("Unexpected error in track-visit:", error);
    return { success: true };
  }
});
