// Homepage defaults live in server/utils/cms-defaults.ts alongside the rest.
import { defaultHomepageSettings } from "../utils/cms-defaults";

export default defineEventHandler(async (event) => {
  // ?defaults=1 — dashboards fetch this for their "reset to defaults" action
  if (getQuery(event).defaults) return defaultHomepageSettings;

  try {
    const db = useDb(event);
    const row = await db.prepare(`SELECT homepage FROM CmsSettings WHERE id = 'default'`).first();
    if (!row?.homepage) return defaultHomepageSettings;

    const saved = JSON.parse(row.homepage as string);
    // hero deep-merges so rows saved before a field existed stay complete;
    // sections/featured/strip pass through as saved — missing toggle = shown,
    // empty featured projectId = hidden
    return {
      ...defaultHomepageSettings,
      ...saved,
      hero: { ...defaultHomepageSettings.hero, ...(saved.hero ?? {}) },
    };
  } catch (error) {
    // DB unavailable (e.g. migrations not applied) — never 500 the homepage
    console.error("Failed to load home settings:", error);
    return defaultHomepageSettings;
  }
});
