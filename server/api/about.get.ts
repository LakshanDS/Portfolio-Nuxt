import { defaultProfile } from "../utils/cms-defaults";

export default defineEventHandler(async (event) => {
  const db = useDb(event);

  try {
    // only the columns the home page renders — Profile holds nothing private now,
    // but explicit beats SELECT * if columns are ever added back
    const profile = await db
      .prepare(
        `SELECT name, title, bio, email, githubUrl, linkedinUrl, whatsappUrl, profileImage FROM Profile LIMIT 1`,
      )
      .first();
    const status = await db.prepare(`SELECT isOpenToWork FROM ProfileStatus LIMIT 1`).first();
    const { results: competencies } = await db
      .prepare(`SELECT id, title, description, expertise, tags FROM CoreCompetency ORDER BY displayOrder ASC`)
      .all();

    return {
      profile: profile ?? { ...defaultProfile },
      isOpenToWork: Boolean(status?.isOpenToWork),
      competencies: competencies.map((row) => ({ ...row, tags: parseTags(row.tags) })),
    };
  } catch (error) {
    // DB unavailable (e.g. migrations not applied) — serve defaults, never 500
    console.error("Error fetching about data:", error);
    return {
      profile: { ...defaultProfile },
      isOpenToWork: false,
      competencies: [],
    };
  }
});
