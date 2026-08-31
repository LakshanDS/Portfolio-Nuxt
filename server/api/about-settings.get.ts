// Stores about-page
// settings in the singleton CmsSettings row (id='default'), `about` JSON
// column. D1 stores JSON columns as strings, so parse before returning.
// Defaults live here — callers (page + dashboard) never carry their own copy.
import { defaultAboutSettings } from "../utils/cms-defaults";

export default defineEventHandler(async (event) => {
  // ?defaults=1 — dashboards fetch this for their "reset to defaults" action
  if (getQuery(event).defaults) return defaultAboutSettings;

  try {
    const row = await useDb(event)
      .prepare(`SELECT about FROM CmsSettings WHERE id = 'default'`)
      .first();

    if (!row) return defaultAboutSettings;

    const raw = row.about;
    const saved = typeof raw === "string" ? JSON.parse(raw) : (raw ?? null);
    return {
      ...defaultAboutSettings,
      ...(saved ?? {}),
      hero: { ...defaultAboutSettings.hero, ...(saved?.hero ?? {}) },
    };
  } catch (e) {
    console.error("Error fetching about settings:", e);
    setResponseStatus(event, 500);
    return { success: false, error: "Failed to fetch settings" };
  }
});
