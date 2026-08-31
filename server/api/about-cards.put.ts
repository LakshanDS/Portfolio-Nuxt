// { id, ...data }.
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const body = JSON.parse((await readRawBody(event, "utf8")) ?? "");
    const { id, ...data } = body;
    const card = await dbUpdateAboutCard(event, id, data);
    return card;
  } catch (error) {
    console.error("Error updating about card:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to update about card" };
  }
});
