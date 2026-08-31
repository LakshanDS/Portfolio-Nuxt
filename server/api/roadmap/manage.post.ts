// Create roadmap item — 201 with the created item, tags parsed back to an array.
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    // JSON.parse the raw body — empty/invalid input throws into the 500 below
    const body = JSON.parse((await readRawBody(event, "utf8")) ?? "") as Record<string, any>;

    const db = useDb(event);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO RoadmapItem (id, title, description, date, category, status, tags, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, body.title, body.description, body.date, body.category, body.status, JSON.stringify(body.tags), now, now)
      .first();

    const row = await db.prepare(`SELECT * FROM RoadmapItem WHERE id = ?`).bind(id).first();
    setResponseStatus(event, 201);
    return { ...row, tags: parseTags(row?.tags) };
  } catch (error) {
    console.error("Error creating roadmap item:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to create roadmap item" };
  }
});
