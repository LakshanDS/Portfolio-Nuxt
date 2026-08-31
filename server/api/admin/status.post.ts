// NOTE: kept as POST — this is a mutation (the dashboard toggles
// isOpenToWork by POSTing JSON), so a .get.ts handler would change behavior.

export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    // JSON.parse the raw body directly — empty/invalid input throws
    // into the catch below (500)
    const { isOpenToWork } = JSON.parse((await readRawBody(event, "utf8")) ?? "") as {
      isOpenToWork?: unknown;
    };
    const flag = isOpenToWork ? 1 : 0;

    const db = useDb(event);
    const status = await db.prepare(`SELECT * FROM ProfileStatus LIMIT 1`).first();
    const now = new Date().toISOString();

    if (status) {
      await db
        .prepare(`UPDATE ProfileStatus SET isOpenToWork = ?, updatedAt = ? WHERE id = ?`)
        .bind(flag, now, status.id)
        .first();
    } else {
      await db
        .prepare(
          `INSERT INTO ProfileStatus (id, isOpenToWork, updatedAt)
           VALUES (?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), flag, now)
        .first();
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to update status" };
  }
});
