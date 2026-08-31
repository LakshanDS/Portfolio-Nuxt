// sitemap.xml — static routes + live project routes.
export default defineEventHandler(async (event) => {
  const siteUrl = useRuntimeConfig(event).public.siteURL as string;
  const baseUrl = siteUrl.trim().replace(/\/$/, "");
  const now = new Date().toISOString();

  const staticRoutes = ["", "/about", "/projects", "/roadmap"].map((path) => ({
    loc: `${baseUrl}${path}`,
    lastmod: now,
    changefreq: "weekly",
    priority: path === "" ? "1" : "0.8",
  }));

  let projectRoutes: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [];
  try {
    const db = useDb(event);
    const { results } = await db.prepare(`SELECT id, updatedAt FROM Project ORDER BY displayOrder ASC, createdAt DESC`).all();
    projectRoutes = (results as Record<string, string>[]).map((row) => ({
      loc: `${baseUrl}/projects/${row.id}`,
      lastmod: row.updatedAt ?? now,
      changefreq: "monthly",
      priority: "0.7",
    }));
  } catch (error) {
    console.warn("Error fetching projects for sitemap:", error);
  }

  const urls = [...staticRoutes, ...projectRoutes]
    .map(
      (r) =>
        `<url><loc>${r.loc}</loc><lastmod>${r.lastmod}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`,
    )
    .join("");

  setHeader(event, "content-type", "application/xml");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
});
