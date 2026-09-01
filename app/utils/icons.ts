// DB stores react-icons names ("SiDocker", "FaGitAlt") plus generated ones
// ("Fa6-arrow-up" → fa-solid, "Fab-docker" → fa-brands) — map all to
// Iconify ids for <Icon>. Legacy Fa*/Si* handling must stay in sync with
// the curated list in app/utils/iconMetadata.ts.

// react-icons/fa mixes FA5 solid + brands; iconify's "fa" pack carries neither
// *-alt names nor brand glyphs — route those to the dedicated packs.
const BRANDS = new Set(["Docker", "Aws", "Github", "Gitlab", "GitAlt", "Linux", "Ubuntu", "Redhat", "Centos"]);
const FA5_SOLID_ONLY = new Set([
  "FileAlt", "PencilAlt", "NetworkWired", "ShieldAlt", "Tools",
  "ChartLine", "ChartBar", "ChartPie", "ProjectDiagram", "MoneyBill",
  "Lightbulb", "Palette", "Clock", "MapMarkerAlt", "CalendarAlt",
  "PizzaSlice", "Utensils",
]);

export function toIconName(icon?: string | null): string {
  if (!icon) return "fa:code";
  // Generated names carry the iconify id verbatim after the pack prefix.
  if (icon.startsWith("Fa6-")) return `fa-solid:${icon.slice(4)}`;
  if (icon.startsWith("Fab-")) return `fa-brands:${icon.slice(4)}`;
  const m = icon.match(/^(Si|Fa)(.+)$/);
  if (!m) return "fa:code";
  const short = m[2]!;
  const kebab = short.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  if (m[1] === "Si") return `simple-icons:${kebab}`;
  if (BRANDS.has(short)) return `fa-brands:${kebab}`;
  if (FA5_SOLID_ONLY.has(short)) return `fa-solid:${kebab}`;
  return `fa:${kebab}`;
}
