// POST - Renew the current session (fresh sliding 10-minute window)

export default defineEventHandler(async (event) => {
  try {
    const currentSession = await getAdminSession(event);

    if (!currentSession) {
      setResponseStatus(event, 401);
      return { success: false, error: "No active session" };
    }

    // Renew session
    const renewedSession = await renewSession(event);

    if (!renewedSession) {
      setResponseStatus(event, 500);
      return { success: false, error: "Failed to renew session" };
    }

    // Set renewed session cookie
    setHeader(event, "Set-Cookie", await setSessionCookie(renewedSession));

    // Log session renewal
    logSessionRenewed(renewedSession.userId);

    return {
      success: true,
      message: "Session renewed",
      expiresAt: renewedSession.expiresAt,
    };
  } catch (error) {
    console.error("Session renewal error:", error);
    setResponseStatus(event, 500);
    return { success: false, error: "Session renewal failed" };
  }
});
