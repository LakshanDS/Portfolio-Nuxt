// Body { type:
// 'category'|'skill', ...fields } → 201 with the created row.
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    // JSON.parse the raw body directly — empty/invalid input throws
    // into the catch below (500)
    const { type, ...rest } = JSON.parse((await readRawBody(event, "utf8")) ?? "") as {
      type?: string;
    } & Record<string, unknown>;
    const db = useDb(event);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    if (type === "category") {
      await db
        .prepare(
          `INSERT INTO SkillCategory (id, name, icon, displayOrder, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(id, rest.name, rest.icon, rest.displayOrder ?? 0, now, now)
        .first();
    } else if (type === "skill") {
      await db
        .prepare(
          `INSERT INTO Skill (id, categoryId, name, icon, iconColor, displayOrder, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          rest.categoryId,
          rest.name,
          rest.icon ?? null,
          rest.iconColor ?? null,
          rest.displayOrder ?? 0,
          now,
          now,
        )
        .first();
    } else {
      setResponseStatus(event, 400);
      return { error: "Invalid type" };
    }

    const table = type === "category" ? "SkillCategory" : "Skill";
    const created = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
    setResponseStatus(event, 201);
    return created;
  } catch (error) {
    console.error("Error creating skill:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to create skill" };
  }
});
