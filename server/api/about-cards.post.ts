export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  try {
    const body = JSON.parse((await readRawBody(event, "utf8")) ?? "");
    const card = await dbCreateAboutCard(event, body);
    setResponseStatus(event, 201);
    return card;
  } catch (error) {
    console.error("Error creating about card:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to create about card" };
  }
});
