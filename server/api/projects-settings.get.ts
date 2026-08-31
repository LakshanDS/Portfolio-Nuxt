// Projects JSON
// column off the singleton CmsSettings row; falls back to defaults when the
// row is missing or the query fails.
import { defaultProjectsSettings } from "../utils/cms-defaults";

interface ProjectsSettings {
  hero: {
    title: string;
    tagline: string;
  };
}

export default defineEventHandler(async (event) => {
  // ?defaults=1 — dashboards fetch this for their "reset to defaults" action
  if (getQuery(event).defaults) return defaultProjectsSettings;

  try {
    const db = useDb(event);

    // create the singleton settings row with defaults if missing
    await db
      .prepare(
        `INSERT OR IGNORE INTO CmsSettings (id, homepage, about, roadmap, projects, createdAt, updatedAt)
         VALUES ('default', '{}', '{}', '{}', ?, CURRENT_TIMESTAMP, ?)`,
      )
      .bind(JSON.stringify(defaultProjectsSettings), new Date().toISOString())
      .first();

    const row = await db.prepare(`SELECT projects FROM CmsSettings WHERE id = 'default'`).first();
    const projects = row?.projects ? JSON.parse(row.projects as string) : null;
    return projects ?? defaultProjectsSettings;
  } catch (error) {
    console.error("Failed to load projects settings:", error);
    return defaultProjectsSettings;
  }
});
