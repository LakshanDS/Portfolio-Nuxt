type RoadmapRow = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  status: string;
  tags: string;
};

type ProjectRow = {
  id: string;
  title: string;
  description: string;
  year: string;
  category: string;
  status: string;
  tags: string;
};

type CareerItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  status: string;
  tags: string[];
};

// project status → career.log status: live/completed/archived ship,
// developing builds, everything planned queues
function careerStatusOf(status: string): string {
  const s = status.trim().toLowerCase();
  if (s === "developing" || s === "in-progress" || s === "devloping") return "in-progress";
  if (s === "planned") return "planned";
  return "completed";
}

export default defineEventHandler(async (event) => {
  const db = useDb(event);
  const [roadmap, projects] = await Promise.all([
    db
      .prepare(`SELECT id, title, description, date, category, status, tags FROM RoadmapItem`)
      .all<RoadmapRow>()
      .then((r) => r.results),
    db
      .prepare(`SELECT id, title, description, year, category, status, tags FROM Project WHERE year != ''`)
      .all<ProjectRow>()
      .then((r) => r.results),
  ]);

  const projectItems: CareerItem[] = projects.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.year,
    category: row.category,
    status: careerStatusOf(row.status),
    tags: parseTags(row.tags),
  }));

  // roadmap entries matching a project keep the project version (it is the
  // shipped artifact) — dedupe case-insensitively on title
  const projectTitles = new Set(projectItems.map((p) => p.title.trim().toLowerCase()));

  const roadmapItems: CareerItem[] = roadmap
    .filter((row) => !projectTitles.has(row.title.trim().toLowerCase()))
    .map((row) => ({ ...row, tags: parseTags(row.tags) }));

  // status priority (planned → in-progress → completed), then date desc
  const statusPriority: Record<string, number> = {
    planned: 0,
    "in-progress": 1,
    completed: 2,
  };
  const priorityOf = (status: string) => statusPriority[status] ?? 0;
  return [...roadmapItems, ...projectItems].sort((a, b) => {
    const priorityDiff = priorityOf(a.status) - priorityOf(b.status);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
});
