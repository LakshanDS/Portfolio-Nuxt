// The only exposed verb: edits an existing competency, 400 on missing fields.
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const { id, title, description, expertise, tags, icon } = JSON.parse(
      (await readRawBody(event, "utf8")) ?? "",
    ) as {
      id?: string;
      title?: string;
      description?: string;
      expertise?: string;
      tags?: string;
      icon?: string;
    };

    if (!id || !title || !description || !expertise) {
      setResponseStatus(event, 400);
      return { error: "Missing required fields" };
    }

    const db = useDb(event);

    // updating a missing row throws → 500 with the error message
    const existing = await db
      .prepare(`SELECT id FROM CoreCompetency WHERE id = ?`)
      .bind(id)
      .first();
    if (!existing) throw new Error(`CoreCompetency with id ${id} not found`);

    await db
      .prepare(
        `UPDATE CoreCompetency
         SET title = ?, description = ?, expertise = ?, tags = ?, icon = ?, updatedAt = ?
         WHERE id = ?`,
      )
      .bind(title, description, expertise, tags || "", icon || null, new Date().toISOString(), id)
      .first();

    return await db.prepare(`SELECT * FROM CoreCompetency WHERE id = ?`).bind(id).first();
  } catch (error) {
    console.error("Error updating core competency:", error);
    setResponseStatus(event, 500);
    return {
      error: error instanceof Error ? error.message : "Failed to update core competency",
    };
  }
});
