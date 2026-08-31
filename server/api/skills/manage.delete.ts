// ?id=&type=
// (category delete cascades its skills via FK). Deleting a missing row throws
// (→ 500) when the row is already gone, so mirror that.
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const { id, type } = getQuery(event) as { id?: string; type?: string };

    if (!id || !type) {
      setResponseStatus(event, 400);
      return { error: "ID and type are required" };
    }

    const db = useDb(event);

    if (type === "category") {
      const existing = await db
        .prepare(`SELECT id FROM SkillCategory WHERE id = ?`)
        .bind(id)
        .first();
      if (!existing) throw new Error("Skill category not found");
      await db.prepare(`DELETE FROM SkillCategory WHERE id = ?`).bind(id).first();
    } else if (type === "skill") {
      const existing = await db.prepare(`SELECT id FROM Skill WHERE id = ?`).bind(id).first();
      if (!existing) throw new Error("Skill not found");
      await db.prepare(`DELETE FROM Skill WHERE id = ?`).bind(id).first();
    } else {
      setResponseStatus(event, 400);
      return { error: "Invalid type" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting skill:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to delete skill" };
  }
});
