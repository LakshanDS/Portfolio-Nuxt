// 201 with row.
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const data = JSON.parse((await readRawBody(event, "utf8")) ?? "") as {
      institution?: string;
      title?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      displayOrder?: number;
    };
    const db = useDb(event);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db
      .prepare(
        `INSERT INTO Education (id, institution, title, description, startDate, endDate, displayOrder, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        data.institution,
        data.title,
        data.description,
        data.startDate,
        data.endDate ?? null,
        data.displayOrder ?? 0,
        now,
        now,
      )
      .first();

    const created = await db.prepare(`SELECT * FROM Education WHERE id = ?`).bind(id).first();
    setResponseStatus(event, 201);
    return created;
  } catch (error) {
    console.error("Error creating education:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to create education" };
  }
});
