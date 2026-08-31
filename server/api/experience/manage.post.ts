// 201 with row.
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const data = JSON.parse((await readRawBody(event, "utf8")) ?? "") as {
      company?: string;
      position?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      isCurrent?: boolean;
    };
    const db = useDb(event);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db
      .prepare(
        `INSERT INTO Experience (id, company, position, description, startDate, endDate, isCurrent, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        data.company,
        data.position,
        data.description,
        data.startDate,
        data.endDate ?? null,
        data.isCurrent ? 1 : 0,
        now,
        now,
      )
      .first();

    const created = (await db.prepare(`SELECT * FROM Experience WHERE id = ?`).bind(id).first()) as
      | Record<string, unknown>
      | null;
    setResponseStatus(event, 201);
    return created ? { ...created, isCurrent: Boolean(created.isCurrent) } : created;
  } catch (error) {
    console.error("Error creating experience:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to create experience" };
  }
});
