// The dashboard
// profile editor reads the FULL Profile row (incl. private fields) from here,
// so it is admin-only, unlike the public /api/profile which whitelists fields.
import { defaultProfile } from "../../utils/cms-defaults";

export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const [profile, stats] = await Promise.all([
      dbGetProfile(event),
      dbGetProfileStats(event),
    ]);
    return { profile: profile ?? { ...defaultProfile }, stats };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return { profile: { ...defaultProfile }, stats: null };
  }
});
