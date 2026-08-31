// Upsert of the CmsSettings `homepage` column (create fills the other
// non-null JSON columns with {}).
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const homepage = JSON.parse((await readRawBody(event, "utf8")) ?? "");
    const db = useDb(event);
    const json = JSON.stringify(homepage);
    const now = new Date().toISOString();

    const row = await db.prepare(`SELECT id FROM CmsSettings WHERE id = 'default'`).first();
    if (row) {
      await db
        .prepare(`UPDATE CmsSettings SET homepage = ?, updatedAt = ? WHERE id = 'default'`)
        .bind(json, now)
        .first();
    } else {
      await db
        .prepare(
          `INSERT INTO CmsSettings (id, homepage, about, roadmap, projects, createdAt, updatedAt)
           VALUES ('default', ?, '{}', '{}', '{}', ?, ?)`,
        )
        .bind(json, now, now)
        .first();
    }

    return { success: true, message: "Settings saved successfully" };
  } catch (e) {
    console.error("Error saving homepage settings:", e);
    setResponseStatus(event, 500);
    return { success: false, error: "Failed to save settings" };
  }
});
