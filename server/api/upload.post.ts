// Multipart image upload into
// the UPLOADS R2 bucket; objects are served back at /uploads/<filename>.
// Same validation, key scheme and response shape.
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export default defineEventHandler(async (event) => {
  const authError = await requireAuth(event);
  if (authError) return authError;

  interface UploadsBucket {
    put: (key: string, value: ArrayBuffer, opts?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
  }

  try {
    const env = event.context.cloudflare?.env as { UPLOADS?: UploadsBucket } | undefined;
    if (!env?.UPLOADS) {
      setResponseStatus(event, 500);
      return { success: false, error: "Upload storage is not configured" };
    }

    const formData = await readFormData(event);
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      setResponseStatus(event, 400);
      return { success: false, error: "No file provided" };
    }

    if (file.size > MAX_FILE_SIZE) {
      setResponseStatus(event, 400);
      return { success: false, error: "File size exceeds 5MB limit" };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setResponseStatus(event, 400);
      return { success: false, error: "Invalid file type. Only jpg, jpeg, png, gif, webp allowed." };
    }

    const prefix = (formData.get("prefix") as string) || "image";
    const extension = MIME_TO_EXT[file.type] || "jpg";
    const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;

    await env.UPLOADS.put(filename, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });

    // Path the dashboard stores in the DB (served by /uploads/*)
    return { success: true, filePath: `/uploads/${filename}`, filename };
  } catch (error) {
    console.error("Error uploading file:", error);
    setResponseStatus(event, 500);
    return { success: false, error: "Failed to upload file" };
  }
});
