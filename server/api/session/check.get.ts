// GET - Check if session is valid and get remaining time

export default defineEventHandler(async (event) => {
  try {
    const session = await getAdminSession(event);

    if (!session) {
      setResponseStatus(event, 401);
      return {
        success: false,
        authenticated: false,
        timeRemaining: 0,
      };
    }

    const timeRemaining = await getSessionTimeRemaining(event);

    return {
      success: true,
      authenticated: true,
      timeRemaining,
      expiresAt: session.expiresAt,
    };
  } catch (error) {
    console.error("Session check error:", error);
    setResponseStatus(event, 500);
    return {
      success: false,
      authenticated: false,
      timeRemaining: 0,
      error: "Session check failed",
    };
  }
});
