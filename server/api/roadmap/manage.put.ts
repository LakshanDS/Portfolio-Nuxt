// Body is
// { id, ...fields }; only the listed fields are copied when defined.
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    // JSON.parse the raw body — empty/invalid input throws into the 500 below
    const body = JSON.parse((await readRawBody(event, "utf8")) ?? "") as Record<string, any>;
    const { id, ...data } = body;

    const db = useDb(event);

    // unknown/missing ids → 500 — check before updating
    const existing = await db.prepare(`SELECT id FROM RoadmapItem WHERE id = ?`).bind(id).first();
    if (!existing) {
      setResponseStatus(event, 500);
      return { error: "Failed to update roadmap item" };
    }

    const sets: string[] = [];
    const values: unknown[] = [];
    for (const field of ["title", "description", "date", "category", "status"]) {
      if (data[field] !== undefined) {
        sets.push(`${field} = ?`);
        values.push(data[field]);
      }
    }
    if (data.tags !== undefined) {
      sets.push(`tags = ?`);
      values.push(JSON.stringify(data.tags));
    }
    sets.push(`updatedAt = ?`);
    values.push(new Date().toISOString());
    values.push(id);

    // .first() executes the UPDATE (no row expected back)
    await db.prepare(`UPDATE RoadmapItem SET ${sets.join(", ")} WHERE id = ?`).bind(...values).first();

    const row = await db.prepare(`SELECT * FROM RoadmapItem WHERE id = ?`).bind(id).first();
    return { ...row, tags: parseTags(row?.tags) };
  } catch (error) {
    console.error("Error updating roadmap item:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to update roadmap item" };
  }
});
