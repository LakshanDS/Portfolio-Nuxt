// Hand-rolled validation; same IP/location capture and response shapes.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LocationData {
  country: string;
  city: string;
}

async function getLocationFromIP(ip: string): Promise<LocationData | null> {
  try {
    const response = await fetch(`https://ip-api.com/json/${ip}`);
    if (!response.ok) return null;

    const data = (await response.json()) as { status?: string; country?: string; city?: string };

    if (data.status === "success") {
      return {
        country: data.country as string,
        city: data.city as string,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching location:", error);
    return null;
  }
}

function getClientIP(headers: Record<string, string | undefined>): string {
  // cf-connecting-ip is set by Cloudflare and not client-spoofable;
  // x-forwarded-for's first entry is attacker-controlled, last resort only
  return (
    headers["cf-connecting-ip"] ||
    headers["x-real-ip"] ||
    headers["x-forwarded-for"]?.split(",").pop()?.trim() ||
    "unknown"
  );
}

const COMMENT_MAX_PER_WINDOW = 5;
const COMMENT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody(event).catch(() => null)) as Record<string, unknown> | null;
    const b = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;

    // zod: projectId min 1, name optional string, email optional email or "",
    // content min 1 max 1000
    const fieldErrors: Record<string, string[]> = {};
    if (typeof b.projectId !== "string" || b.projectId.length < 1) {
      fieldErrors.projectId = ["Project ID is required"];
    }
    if (b.name !== undefined && b.name !== null && typeof b.name !== "string") {
      fieldErrors.name = ["Name must be a string"];
    }
    if (b.email !== undefined && b.email !== "" && (typeof b.email !== "string" || !EMAIL_RE.test(b.email))) {
      fieldErrors.email = ["Invalid email"];
    }
    if (typeof b.content !== "string" || b.content.length < 1) {
      fieldErrors.content = ["Comment cannot be empty"];
    } else if (b.content.length > 1000) {
      fieldErrors.content = ["Comment too long"];
    }

    if (Object.keys(fieldErrors).length > 0) {
      setResponseStatus(event, 400);
      return { error: "Invalid input", details: { formErrors: [], fieldErrors } };
    }

    const projectId = b.projectId as string;
    const name = typeof b.name === "string" ? b.name : null;
    const email = typeof b.email === "string" ? b.email : null;
    const content = b.content as string;

    const headers = getHeaders(event);
    const ip = getClientIP(headers);
    const userAgent = headers["user-agent"] || null;

    // Spam guard — 5 comments per 10 min per IP
    if (!(await checkKeyRateLimit(event, `comment:${ip}`, COMMENT_MAX_PER_WINDOW, COMMENT_WINDOW_MS))) {
      setResponseStatus(event, 429);
      return { error: "Too many comments. Please try again later." };
    }

    const location = await getLocationFromIP(ip);

    const db = useDb(event);
    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO Comment (id, projectId, name, email, content, isRead, country, city, ipAddress, userAgent)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        projectId,
        name || null,
        email || null,
        content,
        location?.country || null,
        location?.city || null,
        ip !== "unknown" ? ip : null,
        userAgent,
      )
      .first();

    const row = await db.prepare(`SELECT * FROM Comment WHERE id = ?`).bind(id).first();
    setResponseStatus(event, 201);
    // Only echo back public fields — never ipAddress/email/userAgent
    return {
      id: row?.id ?? id,
      projectId: row?.projectId ?? projectId,
      name: row?.name ?? name,
      content: row?.content ?? content,
      isRead: Boolean(row?.isRead),
      createdAt: row?.createdAt ?? null,
    };
  } catch (error) {
    console.error("Error creating comment:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to create comment" };
  }
});
