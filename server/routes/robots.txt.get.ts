// robots.txt — allow all, block admin + api, point at the sitemap.
export default defineEventHandler((event) => {
  const siteUrl = useRuntimeConfig(event).public.siteURL as string;
  const baseUrl = siteUrl.trim().replace(/\/$/, "");

  setHeader(event, "content-type", "text/plain; charset=utf-8");
  return `User-Agent: *\nAllow: /\nDisallow: /jasladmin\nDisallow: /api\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
});
