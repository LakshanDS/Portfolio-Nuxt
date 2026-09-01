export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing project id" });

  const db = useDb(event);
  const row = await db
    .prepare(
      `SELECT id, title, description, category, tags, status, year, imageUrl, demoUrl, repoUrl, content, displayOrder, createdAt, updatedAt
       FROM Project WHERE id = ?`,
    )
    .bind(id)
    .first();
  if (!row) throw createError({ statusCode: 404, statusMessage: "Project not found" });

  return {
    ...row,
    // migration left \r\r\n line endings in markdown — \r breaks the heading regex client-side
    content: typeof row.content === "string" ? row.content.replace(/\r/g, "") : row.content,
    tags: parseTags(row.tags),
  };
});
