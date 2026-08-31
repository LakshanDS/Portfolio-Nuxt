// Everything the /about page renders in one payload (mirrors the Next
// page's Promise.all of getProfile/Status/Stats/Cards/Education/Experience/Settings).
import { defaultAboutSettings, defaultProfile } from "../utils/cms-defaults";

export default defineEventHandler(async (event) => {
  const db = useDb(event);

  try {
    // explicit columns — Profile once held private fields (DOB, phones…); keep
    // the whitelist habit so they can't leak back in via SELECT *
    const profile = await db
      .prepare(
        `SELECT name, title, bio, email, githubUrl, linkedinUrl, whatsappUrl, profileImage FROM Profile LIMIT 1`,
      )
      .first();
    const status = await db.prepare(`SELECT isOpenToWork FROM ProfileStatus LIMIT 1`).first();
    const stats = await db.prepare(`SELECT * FROM ProfileStats LIMIT 1`).first();
    const { results: cards } = await db
      .prepare(`SELECT * FROM AboutCard ORDER BY displayOrder ASC`)
      .all();
    const { results: education } = await db
      .prepare(`SELECT * FROM Education ORDER BY displayOrder ASC`)
      .all();
    const { results: experience } = await db
      .prepare(`SELECT * FROM Experience ORDER BY startDate DESC`)
      .all();

    // CmsSettings.about is a JSON column — no AboutSettings table
    const settingsRow = await db.prepare(`SELECT about FROM CmsSettings WHERE id = 'default'`).first();
    let settings = { ...defaultAboutSettings };
    try {
      const raw = settingsRow?.about;
      const saved = typeof raw === "string" ? JSON.parse(raw) : (raw ?? null);
      settings = {
        ...defaultAboutSettings,
        ...(saved ?? {}),
        hero: { ...defaultAboutSettings.hero, ...(saved?.hero ?? {}) },
      };
    } catch {
      // keep defaults
    }

    return {
      profile: profile ?? { ...defaultProfile },
      isOpenToWork: Boolean(status?.isOpenToWork),
      stats: stats ?? null,
      cards,
      education,
      experience,
      settings,
    };
  } catch (error) {
    // DB unavailable (e.g. migrations not applied) — serve fallbacks so the
    // page still renders (terminal bio, photo, empty sections)
    console.error("Failed to load about page data:", error);
    return {
      profile: { ...defaultProfile },
      isOpenToWork: false,
      stats: null,
      cards: [],
      education: [],
      experience: [],
      settings: { ...defaultAboutSettings },
    };
  }
});
