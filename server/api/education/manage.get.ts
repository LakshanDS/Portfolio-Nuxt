// Public (no auth);
// unlike the public /api/education, errors surface as 500 here.
export default defineEventHandler(async (event) => {
  try {
    const db = useDb(event);
    const { results } = await db
      .prepare(`SELECT * FROM Education ORDER BY displayOrder ASC`)
      .all();
    return results;
  } catch (error) {
    console.error("Error fetching education:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to fetch education" };
  }
});
