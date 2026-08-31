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
    const existing = await db.prepare(`SELECT id FROM Experience WHERE id = ?`).bind(id).first();
    if (!existing) throw new Error("Experience not found");

    const updates: Record<string, unknown> = {};
    if (data.company !== undefined) updates.company = data.company;
    if (data.position !== undefined) updates.position = data.position;
    if (data.description !== undefined) updates.description = data.description;
    if (data.startDate !== undefined) updates.startDate = data.startDate;
    if (data.endDate !== undefined) updates.endDate = data.endDate;
    if (data.isCurrent !== undefined) updates.isCurrent = data.isCurrent ? 1 : 0;

    if (Object.keys(updates).length > 0) {
      const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      await db
        .prepare(`UPDATE Experience SET ${setClause}, updatedAt = ? WHERE id = ?`)
        .bind(...Object.values(updates), now, id)
        .first();
    }

    const row = await db.prepare(`SELECT * FROM Experience WHERE id = ?`).bind(id).first();
    return row ? { ...row, isCurrent: Boolean(row.isCurrent) } : row;
  } catch (error) {
    console.error("Error updating experience:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to update experience" };
  }
});
