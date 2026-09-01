type RoadmapRow = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  status: string;
  tags: string;
};

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const { results } = await db
    .prepare(`SELECT id, title, description, date, category, status, tags FROM RoadmapItem`)
    .all<RoadmapRow>();

  // status priority (planned → in-progress → completed), then date desc
  const statusPriority: Record<string, number> = {
    planned: 0,
    "in-progress": 1,
    completed: 2,
  };
  const priorityOf = (status: string) => statusPriority[status] ?? 0;
  return results
    .map(({ tags, ...row }) => ({ ...row, tags: parseTags(tags) }))
    .sort((a, b) => {
      const priorityDiff = priorityOf(a.status) - priorityOf(b.status);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
});
