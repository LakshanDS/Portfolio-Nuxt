export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const { results } = await db
    .prepare(`SELECT id, title, description, date, category, status, tags FROM RoadmapItem`)
    .all();

  // status priority (planned → in-progress → completed), then date desc
  const statusPriority: Record<string, number> = {
    planned: 0,
    "in-progress": 1,
    completed: 2,
  };
  return results
    .map((row) => ({ ...row, tags: parseTags(row.tags) }))
    .sort((a, b) => {
      const priorityDiff = statusPriority[a.status as string] - statusPriority[b.status as string];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.date as string).getTime() - new Date(a.date as string).getTime();
    });
});
