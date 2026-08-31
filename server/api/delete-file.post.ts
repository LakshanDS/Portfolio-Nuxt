// Deletes an object from
// the UPLOADS R2 bucket. Only allows deletion of files under /uploads/.
export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  interface UploadsBucket {
    delete: (key: string) => Promise<unknown>;
  }

  try {
    // JSON.parse the raw body — empty/invalid input throws into the 500 below
    const body = JSON.parse((await readRawBody(event, "utf8")) ?? "") as { filePath?: unknown };
    const { filePath } = body;

    if (!filePath || typeof filePath !== "string") {
      setResponseStatus(event, 400);
      return { success: false, error: "Invalid file path" };
    }

    if (!filePath.startsWith("/uploads/")) {
      setResponseStatus(event, 400);
      return { success: false, error: "Can only delete uploaded files" };
    }

    // Prevent path traversal attacks
    const filename = filePath.replace(/^\/uploads\//, "");
    if (filePath.includes("..") || filename.includes("/") || filename.includes("\\") || !filename) {
      setResponseStatus(event, 400);
      return { success: false, error: "Invalid file path - path traversal detected" };
    }

    const env = event.context.cloudflare?.env as { UPLOADS?: UploadsBucket } | undefined;
    if (!env?.UPLOADS) {
      setResponseStatus(event, 500);
      return { success: false, error: "Upload storage is not configured" };
    }

    await env.UPLOADS.delete(filename);

    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error("Error deleting file:", error);
    setResponseStatus(event, 500);
    return { success: false, error: "Failed to delete file" };
  }
});
