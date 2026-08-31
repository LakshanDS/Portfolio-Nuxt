// Public list ordered by displayOrder.
export default defineEventHandler(async (event) => {
  try {
    const db = useDb(event);
    const { results: competencies } = await db
      .prepare(`SELECT * FROM CoreCompetency ORDER BY displayOrder ASC`)
      .all();
    return competencies;
  } catch (error) {
    console.error("Error fetching core competencies:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to fetch core competencies" };
  }
});
