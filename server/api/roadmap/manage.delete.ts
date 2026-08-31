// 400 when
// the id query is missing; unknown ids → 500.
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const { id } = getQuery(event);

    if (!id) {
      setResponseStatus(event, 400);
      return { error: "ID is required" };
    }

    const db = useDb(event);

    const existing = await db.prepare(`SELECT id FROM RoadmapItem WHERE id = ?`).bind(id).first();
    if (!existing) {
      setResponseStatus(event, 500);
      return { error: "Failed to delete roadmap item" };
    }

    // .first() executes the DELETE (no row returned)
    await db.prepare(`DELETE FROM RoadmapItem WHERE id = ?`).bind(id).first();
    return { success: true };
  } catch (error) {
    console.error("Error deleting roadmap item:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to delete roadmap item" };
  }
});
