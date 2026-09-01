// Updates only the listed fields when defined; displayOrder
// drives the two featured slots on /projects (first two by order).
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  const id = getRouterParam(event, "id");

  try {
    // JSON.parse the raw body — empty/invalid input throws into the 500 below
    const body = JSON.parse((await readRawBody(event, "utf8")) ?? "") as Record<string, any>;

    const db = useDb(event);

    // unknown ids → 500 — check before updating
    const existing = await db.prepare(`SELECT id FROM Project WHERE id = ?`).bind(id).first();
    if (!existing) {
      setResponseStatus(event, 500);
      return { error: "Failed to update project" };
    }

    const sets: string[] = [];
    const values: unknown[] = [];
    for (const field of ["title", "description", "category", "status", "year", "imageUrl", "demoUrl", "repoUrl", "content", "displayOrder"]) {
      if (body[field] !== undefined) {
        sets.push(`${field} = ?`);
        values.push(body[field]);
      }
    }
    if (body.tags !== undefined) {
      sets.push(`tags = ?`);
      values.push(JSON.stringify(body.tags));
    }
    sets.push(`updatedAt = ?`);
    values.push(new Date().toISOString());
    values.push(id);

    // .first() executes the UPDATE (no row expected back)
    await db.prepare(`UPDATE Project SET ${sets.join(", ")} WHERE id = ?`).bind(...values).first();

    const row = await db.prepare(`SELECT * FROM Project WHERE id = ?`).bind(id).first();
    return { ...row, tags: parseTags(row?.tags) };
  } catch (error) {
    console.error("Error updating project:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to update project" };
  }
});
