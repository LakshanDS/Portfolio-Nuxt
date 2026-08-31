// Roadmap settings — JSON column off the singleton CMS settings row.
// Defaults live here — callers (page + dashboard) never carry their own copy.
import { defaultRoadmapSettings } from "../utils/cms-defaults";

export default defineEventHandler(async (event) => {
  // ?defaults=1 — dashboards fetch this for their "reset to defaults" action
  if (getQuery(event).defaults) return defaultRoadmapSettings;

  try {
    const db = useDb(event);
    const row = await db.prepare(`SELECT roadmap FROM CmsSettings WHERE id = 'default'`).first();
    const saved = row ? JSON.parse((row.roadmap as string) || "null") : null;
    return {
      ...defaultRoadmapSettings,
      ...(saved ?? {}),
      hero: { ...defaultRoadmapSettings.hero, ...(saved?.hero ?? {}) },
    };
  } catch (error) {
    console.warn("Error fetching roadmap settings:", error);
    return defaultRoadmapSettings;
  }
});
