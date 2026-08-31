// Body { type, id,
// ...fields }; only defined whitelisted fields are updated, 404 when the row
// is missing ("...not found").
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const { type, id, ...rest } = JSON.parse((await readRawBody(event, "utf8")) ?? "") as {
      type?: string;
      id?: string;
    } & Record<string, unknown>;
    const db = useDb(event);
    const now = new Date().toISOString();

    let updates: Record<string, unknown> = {};
    if (type === "category") {
      const existing = await db
        .prepare(`SELECT * FROM SkillCategory WHERE id = ?`)
        .bind(id)
        .first();
      if (!existing) throw new Error(`Skill category with id ${id} not found`);

      if (rest.name !== undefined) updates.name = rest.name;
      if (rest.icon !== undefined) updates.icon = rest.icon;
      if (rest.displayOrder !== undefined) updates.displayOrder = rest.displayOrder;
    } else if (type === "skill") {
      const existing = await db.prepare(`SELECT * FROM Skill WHERE id = ?`).bind(id).first();
      if (!existing) throw new Error(`Skill with id ${id} not found`);

      if (rest.name !== undefined) updates.name = rest.name;
      if (rest.icon !== undefined) updates.icon = rest.icon;
      if (rest.iconColor !== undefined) updates.iconColor = rest.iconColor;
      if (rest.displayOrder !== undefined) updates.displayOrder = rest.displayOrder;
    } else {
      setResponseStatus(event, 400);
      return { error: "Invalid type" };
    }

    if (Object.keys(updates).length > 0) {
      const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      await db
        .prepare(`UPDATE ${type === "category" ? "SkillCategory" : "Skill"} SET ${setClause}, updatedAt = ? WHERE id = ?`)
        .bind(...Object.values(updates), now, id)
        .first();
    }

    const table = type === "category" ? "SkillCategory" : "Skill";
    return await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
  } catch (error) {
    console.error("Error updating skill:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      setResponseStatus(event, 404);
      return { error: error.message };
    }

    setResponseStatus(event, 500);
    return { error: "Failed to update skill" };
  }
});
