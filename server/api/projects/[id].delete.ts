// Delete project. Unknown ids → 500 'Failed to delete project'.
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  const id = getRouterParam(event, "id");

  try {
    const db = useDb(event);

    const existing = await db.prepare(`SELECT id FROM Project WHERE id = ?`).bind(id).first();
    if (!existing) {
      setResponseStatus(event, 500);
      return { error: "Failed to delete project" };
    }

    // .first() executes the DELETE (no row returned)
    await db.prepare(`DELETE FROM Project WHERE id = ?`).bind(id).first();
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to delete project" };
  }
});
