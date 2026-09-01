// Dashboard save:
// { profileId, statsId, profileData, statsData }; profileId 'default'/missing
// resolves to the singleton profile row.
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const data = JSON.parse((await readRawBody(event, "utf8")) ?? "");
    let { profileId, statsId, profileData, statsData } = data;

    // If profileId is 'default' or missing, get the actual profile ID
    if (profileId === "default" || !profileId) {
      const profile = await dbGetProfile(event);
      if (profile) {
        profileId = profile.id as string;
      } else {
        setResponseStatus(event, 404);
        return { error: "No profile found" };
      }
    }

    if (profileId && profileData) {
      await dbUpdateProfile(event, profileId, profileData);
    }

    if (statsData) {
      if (statsId) await dbUpdateProfileStats(event, statsId, statsData);
      else await dbCreateProfileStats(event, statsData);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to update profile" };
  }
});
