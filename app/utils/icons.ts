// DB stores react-icons names ("SiDocker", "FaGitAlt") — map to Iconify ids
// for <Icon>. Keep in sync with app/utils/iconMetadata.ts (single source
// for <UiIconPicker>).

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
  const m = icon.match(/^(Si|Fa)(.+)$/);
  if (!m) return "fa:code";
  const short = m[2];
  const kebab = short.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  if (m[1] === "Si") return `simple-icons:${kebab}`;
  if (BRANDS.has(short)) return `fa-brands:${kebab}`;
  if (FA5_SOLID_ONLY.has(short)) return `fa-solid:${kebab}`;
  return `fa:${kebab}`;
}
