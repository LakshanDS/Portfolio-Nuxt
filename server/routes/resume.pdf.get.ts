/**
 * Resume download — the PDF is generated on the fly from portfolio data
 * (photo + profile + key/developing projects + education + experience +
 * skills), and the download is counted into ProfileStats (skipping
 * prefetch/range requests). Key projects are the first 3 by display order,
 * the developing one is the first project with "developing" status, and
 * in-progress roadmap items join it in the "Developing Projects" section.
 * "See Doc" links point at the /projects/:id dossier and only appear when the
 * project has documentation content.
 */
import type { H3Event } from "h3";
import { buildResumePdf, type ResumeData, type ResumePhoto } from "../utils/resume-pdf";

// minimal worker binding shapes — same hand-rolled style as the uploads route
type WorkerEnv = {
  UPLOADS?: {
    get: (key: string) => Promise<{
      body: ReadableStream;
      arrayBuffer: () => Promise<ArrayBuffer>;
      httpMetadata: { contentType?: string };
    } | null>;
  };
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
};

// resolves /uploads/... (R2) and bundled assets like /myself.jpeg into the
// bytes for the PDF photo. No network self-fetch on Workers: on workers.dev a
// Worker fetching its own URL is rejected (error 1042), which silently dropped
// the photo from production PDFs. Tries R2 → assets binding → plain fetch
// (the latter only ever succeeds on node runtimes, i.e. local dev).
// Any failure just means no photo.
async function loadPhoto(event: H3Event, imagePath: string): Promise<ResumePhoto | null> {
  const sources: Array<() => Promise<{ bytes: ArrayBuffer; contentType: string } | null>> = [];
  const env = (event.context as { cloudflare?: { env?: WorkerEnv } }).cloudflare?.env;
  const url = new URL(imagePath, getRequestURL(event).origin);

  if (url.pathname.startsWith("/uploads/") && env?.UPLOADS) {
    sources.push(async () => {
      const key = decodeURIComponent(url.pathname.slice("/uploads/".length));
      const object = key ? await env.UPLOADS!.get(key) : null;
      if (!object) return null;
      return { bytes: await object.arrayBuffer(), contentType: object.httpMetadata?.contentType ?? "" };
    });
  }

  if (env?.ASSETS) {
    sources.push(async () => {
      const res = await env.ASSETS!.fetch(new Request(url));
      if (!res.ok) return null;
      return { bytes: await res.arrayBuffer(), contentType: res.headers.get("content-type") ?? "" };
    });
  }

  sources.push(async () => {
    const res = await fetch(url);
    if (!res.ok) return null;
    return { bytes: await res.arrayBuffer(), contentType: res.headers.get("content-type") ?? "" };
  });

  for (const load of sources) {
    try {
      const result = await load();
      if (!result) continue;
      if (!/image\/(png|jpe?g)/.test(result.contentType)) continue; // not image bytes — try the next source
      return { data: new Uint8Array(result.bytes), kind: result.contentType.includes("png") ? "png" : "jpg" };
    } catch {
      // try the next source
    }
  }
  return null;
}

export default defineEventHandler(async (event) => {
  const purpose = getHeader(event, "purpose") || getHeader(event, "sec-purpose") || "";
  const isPrefetch =
    purpose.includes("prefetch") || getHeader(event, "x-middleware-prefetch") === "1" || getHeader(event, "x-nextjs-prefetch") === "1";
  const hasRange = getHeader(event, "range") !== undefined;

  const db = useDb(event);

  // db.batch always yields one result per statement — satisfy noUncheckedIndexedAccess
  const rowsOf = (r: { results: Record<string, unknown>[] } | undefined) => r?.results ?? [];
  const [profileRes, projectsRes, roadmapRes, experienceRes, educationRes, skillsRes] = await db.batch<
    Record<string, unknown>
  >([
    db.prepare(`SELECT * FROM Profile LIMIT 1`),
    db.prepare(
      `SELECT id, title, description, status, tags, content FROM Project ORDER BY displayOrder ASC, createdAt DESC`,
    ),
    db.prepare(
      `SELECT title, description, status FROM RoadmapItem
       WHERE LOWER(TRIM(status)) = 'in-progress' ORDER BY date DESC LIMIT 3`,
    ),
    db.prepare(
      `SELECT position, company, description, startDate, endDate FROM Experience ORDER BY startDate DESC LIMIT 3`,
    ),
    db.prepare(
      `SELECT title, institution, description, startDate, endDate FROM Education ORDER BY startDate DESC LIMIT 3`,
    ),
    db.prepare(
      `SELECT Skill.name AS name, SkillCategory.name AS category FROM Skill
       JOIN SkillCategory ON Skill.categoryId = SkillCategory.id
       ORDER BY SkillCategory.displayOrder ASC, Skill.displayOrder ASC`,
    ),
  ]);

  const profile = rowsOf(profileRes)[0] ?? null;

  // mirrors the old route's status normalization (handles the 'devloping' typo)
  const normalizeStatus = (status: string) => {
    const normalized = status.trim().toLowerCase();
    if (normalized === "archive") return "archived";
    if (normalized === "devloping") return "developing";
    return normalized;
  };

  const origin = getRequestURL(event).origin;
  const parseTags = (raw: unknown): string[] => {
    try {
      const parsed = JSON.parse(String(raw ?? "[]"));
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  };
  const allProjects = rowsOf(projectsRes).map((row) => ({
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    status: normalizeStatus(String(row.status ?? "")),
    tags: parseTags(row.tags),
    // dossier link only when the project actually has documentation content
    docUrl: String(row.content ?? "").trim() ? `${origin}/projects/${row.id}` : null,
  }));
  const keyProjects = allProjects.slice(0, 3);
  const developingProjects = allProjects.filter((p) => p.status === "developing").slice(0, 1);

  // in-progress roadmap items join the developing projects, linked to their
  // project dossier when a same-titled project has docs
  const projectByTitle = new Map(allProjects.map((p) => [p.title.trim().toLowerCase(), p]));
  const developingTitles = new Set(developingProjects.map((p) => p.title.trim().toLowerCase()));
  const roadmapFocus = rowsOf(roadmapRes)
    .map((row) => {
      const title = String(row.title ?? "");
      const match = projectByTitle.get(title.trim().toLowerCase());
      return { title, description: String(row.description ?? ""), tags: [] as string[], docUrl: match?.docUrl ?? null };
    })
    .filter((item) => !developingTitles.has(item.title.trim().toLowerCase()));

  const data: Omit<ResumeData, "photo"> = {
    profile: profile
      ? {
          name: String(profile.name ?? ""),
          title: String(profile.title ?? ""),
          bio: String(profile.bio ?? ""),
          email: String(profile.email ?? ""),
          phone: String(profile.phone ?? ""),
          githubUrl: String(profile.githubUrl ?? ""),
          linkedinUrl: String(profile.linkedinUrl ?? ""),
          whatsappUrl: String(profile.whatsappUrl ?? ""),
          dateOfBirth: String(profile.dateOfBirth ?? ""),
          gender: String(profile.gender ?? ""),
          address: String(profile.address ?? ""),
        }
      : null,
    projects: keyProjects.map(({ title, description, tags, docUrl }) => ({ title, description, tags, docUrl })),
    developingProjects: [...developingProjects, ...roadmapFocus].map(({ title, description, tags, docUrl }) => ({
      title,
      description,
      tags,
      docUrl,
    })),
    experience: rowsOf(experienceRes).map((row) => ({
      title: String(row.position ?? ""),
      place: String(row.company ?? ""),
      description: String(row.description ?? ""),
      startDate: String(row.startDate ?? ""),
      endDate: row.endDate ? String(row.endDate) : null,
    })),
    education: rowsOf(educationRes).map((row) => ({
      title: String(row.institution ?? ""),
      place: String(row.title ?? ""),
      description: String(row.description ?? ""),
      startDate: String(row.startDate ?? ""),
      endDate: row.endDate ? String(row.endDate) : null,
    })),
    skills: rowsOf(skillsRes).reduce<ResumeData["skills"]>((groups, row) => {
      const category = String(row.category ?? "");
      let group = groups.find((g) => g.category === category);
      if (!group) {
        group = { category, skills: [] };
        groups.push(group);
      }
      group.skills.push(String(row.name ?? ""));
      return groups;
    }, []),
  };

  const photo = profile?.profileImage
    ? await loadPhoto(event, String(profile.profileImage))
    : null;

  const pdfBytes = await buildResumePdf({ ...data, photo });

  if (!isPrefetch && !hasRange) {
    try {
      const stats = await db.prepare(`SELECT id FROM ProfileStats LIMIT 1`).first();
      if (stats) {
        await db
          .prepare(`UPDATE ProfileStats SET resumeDownloads = resumeDownloads + 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`)
          .bind(stats.id)
          .first();
      } else {
        await db
          .prepare(
            `INSERT INTO ProfileStats ("id", "pipelinesFixed", "projectsCount", "selfCommits", "experience", "resumeDownloads", "createdAt", "updatedAt")
             VALUES (?, '0', 0, 0, '0', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          )
          .bind(crypto.randomUUID())
          .first();
      }
    } catch (err) {
      console.error("Failed to update resume stats", err);
    }
  }

  const slug =
    (data.profile?.name || "resume")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "resume";

  // BodyInit wants ArrayBuffer-backed bytes (TS 5.9 ArrayBufferLike split);
  // slice() copies into a right-sized buffer
  return new Response(pdfBytes.slice().buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug}-resume.pdf"`,
      "Cache-Control": "no-store",
    },
  });
});
