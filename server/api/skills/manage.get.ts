// Public (no auth),
// but errors surface as 500 here (unlike the public /api/skills).
export default defineEventHandler(async (event) => {
  try {
    const db = useDb(event);
    const { results: categories } = await db
      .prepare(`SELECT * FROM SkillCategory ORDER BY displayOrder ASC`)
      .all();
    const { results: skills } = await db
      .prepare(`SELECT * FROM Skill ORDER BY displayOrder ASC`)
      .all();

    return categories.map((category) => ({
      category,
      skills: skills.filter((skill) => skill.categoryId === category.id),
    }));
  } catch (error) {
    console.error("Error fetching skills:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to fetch skills" };
  }
});
