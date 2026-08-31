// POST - Logout and clear the session

export default defineEventHandler(async (event) => {
  try {
    const response = {
      success: true,
      message: "Logged out successfully",
    };

    // Clear session cookie
    setHeader(event, "Set-Cookie", clearSessionCookie());

    // Log logout
    logLogout("admin");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    setResponseStatus(event, 500);
    return { success: false, error: "Logout failed" };
  }
});
