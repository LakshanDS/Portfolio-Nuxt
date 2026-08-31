// Admin dashboard stats via raw D1 SQL.
export default defineEventHandler(async (event) => {
  // SECURITY: Require authentication
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const db = useDb(event);

    const [projectCount, roadmapCount, profileStatus, profileStats, visits, comments, visitorsByLocation] =
      await Promise.all([
        db.prepare(`SELECT COUNT(*) AS n FROM Project`).first(),
        db.prepare(`SELECT COUNT(*) AS n FROM RoadmapItem`).first(),
        db.prepare(`SELECT * FROM ProfileStatus LIMIT 1`).first(),
        db.prepare(`SELECT * FROM ProfileStats LIMIT 1`).first(),
        // last 30 calendar days (date ASC alone would return the
        // OLDEST 30 dates ever recorded — traffic chart froze on month one)
        db.prepare(
          `SELECT date, SUM(count) AS total FROM PageVisit
           WHERE date >= date('now', '-29 days')
           GROUP BY date ORDER BY date ASC LIMIT 30`,
        ).all(),
        db.prepare(`SELECT * FROM Comment ORDER BY isRead ASC, createdAt DESC LIMIT 50`).all(),
        db.prepare(
          `SELECT country, COUNT(ipAddress) AS n FROM PageVisit WHERE country IS NOT NULL GROUP BY country ORDER BY COUNT(ipAddress) DESC`,
        ).all(),
      ]);

    const locationRows = visitorsByLocation.results;
    const totalVisitorsWithLocation = locationRows.reduce((sum, loc) => sum + (loc.n as number), 0);
    const locationStats = locationRows.map((loc) => ({
      country: loc.country as string,
      count: loc.n as number,
      percentage:
        totalVisitorsWithLocation > 0
          ? Math.round(((loc.n as number) / totalVisitorsWithLocation) * 100)
          : 0,
    }));

    return {
      counts: {
        projects: (projectCount?.n as number) || 0,
        roadmap: (roadmapCount?.n as number) || 0,
        resumeDownloads: (profileStats?.resumeDownloads as number) || 0,
      },
      status: {
        isOpenToWork: Boolean(profileStatus?.isOpenToWork),
      },
      visits: visits.results.map((v) => ({ date: v.date as string, count: (v.total as number) || 0 })),
      comments: comments.results.map((row) => ({ ...row, isRead: Boolean(row.isRead) })),
      locationStats,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to fetch dashboard stats" };
  }
});
