export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const { results } = await db
    .prepare(
      `SELECT id, title, description, category, tags, status, imageUrl, demoUrl, repoUrl, content
       FROM Project ORDER BY displayOrder ASC, createdAt DESC`,
    )
    .all();
  return results.map((row) => ({ ...row, tags: parseTags(row.tags) }));
});
