// Public; degrades
// to an empty list (200) on DB errors.
export default defineEventHandler(async (event) => {
  try {
    return await dbGetAboutCards(event);
  } catch (error) {
    console.error("Error fetching about cards:", error);
    return [];
  }
});
