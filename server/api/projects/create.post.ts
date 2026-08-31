// Create project — 500 when title/description/category/tags/status are
// missing; response shape: 201 with the created project, tags parsed back
// to an array.
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
        `INSERT INTO Project (id, title, description, category, tags, status, imageUrl, demoUrl, repoUrl, content, displayOrder, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        body.title,
        body.description,
        body.category,
        JSON.stringify(body.tags),
        body.status,
        body.imageUrl ?? null,
        body.demoUrl ?? null,
        body.repoUrl ?? null,
        body.content ?? null,
        typeof body.displayOrder === "number" ? body.displayOrder : 999,
        now,
        now,
      )
      .first();

    const row = await db.prepare(`SELECT * FROM Project WHERE id = ?`).bind(id).first();
    setResponseStatus(event, 201);
    return { ...row, tags: parseTags(row?.tags) };
  } catch (error) {
    console.error("Error creating project:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to create project" };
  }
});
