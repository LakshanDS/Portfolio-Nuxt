// ?id= required
// ("ID is required" here vs "ID required" on the public route).
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const { id } = getQuery(event) as { id?: string };
    if (!id) {
      setResponseStatus(event, 400);
      return { error: "ID is required" };
    }

    const db = useDb(event);
    // deleting a missing row throws → 500 (kept behavior)
    const existing = await db.prepare(`SELECT id FROM Education WHERE id = ?`).bind(id).first();
    if (!existing) throw new Error("Education not found");

    await db.prepare(`DELETE FROM Education WHERE id = ?`).bind(id).first();
    return { success: true };
  } catch (error) {
    console.error("Error deleting education:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to delete education" };
  }
});
