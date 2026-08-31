// Overwrites
// the projects JSON column of the singleton CmsSettings row.
import { defaultProjectsSettings } from "../utils/cms-defaults";

interface ProjectsSettings {
  hero: {
    title: string;
    tagline: string;
  };
}

export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const settings = JSON.parse((await readRawBody(event, "utf8")) ?? "") as ProjectsSettings;

    const db = useDb(event);

    await db
      .prepare(
        `INSERT OR IGNORE INTO CmsSettings (id, homepage, about, roadmap, projects, createdAt, updatedAt)
         VALUES ('default', '{}', '{}', '{}', ?, CURRENT_TIMESTAMP, ?)`,
      )
      .bind(JSON.stringify(defaultProjectsSettings), new Date().toISOString())
      .first();

    await db
      .prepare(`UPDATE CmsSettings SET projects = ?, updatedAt = ? WHERE id = 'default'`)
      .bind(JSON.stringify(settings), new Date().toISOString())
      .first();

    return { success: true, message: "Settings saved successfully" };
  } catch (error) {
    console.error("Failed to save projects settings:", error);
    setResponseStatus(event, 500);
    return { success: false, error: "Failed to save settings" };
  }
});
