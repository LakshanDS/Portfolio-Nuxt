// { profile, stats }.
// NOTE: also keeps `isOpenToWork` — existing consumers
// (app.vue, SiteFooter, roadmap/projects pages) read it from this endpoint.
// SECURITY: only expose what the public site renders.
import { defaultProfile } from "../utils/cms-defaults";

const PUBLIC_PROFILE_FIELDS = [
  "name",
  "title",
  "bio",
  "email",
  "githubUrl",
  "linkedinUrl",
  "whatsappUrl",
  "profileImage",
] as const;

function publicProfile(profile: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!profile) return null;
  return Object.fromEntries(
    PUBLIC_PROFILE_FIELDS.map((field) => [field, profile[field] ?? null]),
  );
}

export default defineEventHandler(async (event) => {
  try {
    const db = useDb(event);
    // one D1 round trip instead of three concurrent ones
    const [profileRes, statsRes, statusRes] = await db.batch<Record<string, unknown>>([
      db.prepare(`SELECT * FROM Profile LIMIT 1`),
      db.prepare(`SELECT * FROM ProfileStats LIMIT 1`),
      db.prepare(`SELECT isOpenToWork FROM ProfileStatus LIMIT 1`),
    ]);
    return {
      profile: publicProfile(profileRes.results[0] ?? { ...defaultProfile }),
      stats: statsRes.results[0] ?? null,
      isOpenToWork: Boolean(statusRes.results[0]?.isOpenToWork),
    };
  } catch (error) {
    // DB unavailable (e.g. migrations not applied) — serve defaults, never 500:
    // footer/contact links must render without a database
    console.error("Error fetching profile:", error);
    return {
      profile: publicProfile({ ...defaultProfile }),
      stats: null,
      isOpenToWork: false,
    };
  }
});
