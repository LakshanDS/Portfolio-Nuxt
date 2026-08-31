// Public (no auth);
// unlike the public /api/experience, errors surface as 500 here.
export default defineEventHandler(async (event) => {
  try {
    const db = useDb(event);
    const { results } = await db
      .prepare(`SELECT * FROM Experience ORDER BY startDate DESC`)
      .all();
    // booleans come back as real booleans — D1 stores 0/1
    return results.map((row) => ({ ...row, isCurrent: Boolean(row.isCurrent) }));
  } catch (error) {
    console.error("Error fetching experience:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to fetch experience" };
  }
});
