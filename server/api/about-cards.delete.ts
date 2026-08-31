// ?id= required.
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const id = getQuery(event).id as string | undefined;
    if (!id) {
      setResponseStatus(event, 400);
      return { error: "ID required" };
    }
    await dbDeleteAboutCard(event, id);
    return { success: true };
  } catch (error) {
    console.error("Error deleting about card:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to delete about card" };
  }
});
