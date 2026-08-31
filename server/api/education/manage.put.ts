// Body { id, ...fields }.
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const { id, ...data } = JSON.parse((await readRawBody(event, "utf8")) ?? "") as {
      id?: string;
    } & Record<string, unknown>;
    const db = useDb(event);
    const now = new Date().toISOString();

    // updating a missing row throws → 500 (kept behavior)
    const existing = await db.prepare(`SELECT id FROM Education WHERE id = ?`).bind(id).first();
    if (!existing) throw new Error("Education not found");

    const updates: Record<string, unknown> = {};
    if (data.institution !== undefined) updates.institution = data.institution;
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.startDate !== undefined) updates.startDate = data.startDate;
    if (data.endDate !== undefined) updates.endDate = data.endDate;
    if (data.displayOrder !== undefined) updates.displayOrder = data.displayOrder;

    if (Object.keys(updates).length > 0) {
      const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      await db
        .prepare(`UPDATE Education SET ${setClause}, updatedAt = ? WHERE id = ?`)
        .bind(...Object.values(updates), now, id)
        .first();
    }

    return await db.prepare(`SELECT * FROM Education WHERE id = ?`).bind(id).first();
  } catch (error) {
    console.error("Error updating education:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to update education" };
  }
});
