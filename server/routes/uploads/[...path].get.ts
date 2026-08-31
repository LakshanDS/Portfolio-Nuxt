// R2 uploads proxy — serves bucket objects
// (project images, logos) under the same URLs the CMS stores.
export default defineEventHandler(async (event) => {
  const raw = (event.context.params as Record<string, string | string[]>).path;
  const key = Array.isArray(raw) ? raw.join("/") : raw;
  if (!key) throw createError({ statusCode: 400, statusMessage: "Missing object key" });

  const env = event.context.cloudflare?.env as
    | { UPLOADS?: { get: (key: string) => Promise<{ body: ReadableStream; httpMetadata: { contentType?: string } } | null> } }
    | undefined;
  const object = await env?.UPLOADS?.get(key);
  if (!object) throw createError({ statusCode: 404, statusMessage: "Object not found" });

  setHeader(event, "content-type", object.httpMetadata?.contentType ?? "application/octet-stream");
  setHeader(event, "x-content-type-options", "nosniff");
  setHeader(event, "cache-control", "public, max-age=3600");
  return object.body;
});
