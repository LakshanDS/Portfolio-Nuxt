// DB and admin UI store icon names in react-icons format
// ("FaDocker", "SiTypescript"); render via toIconName() in app/utils/icons.ts.
// Consumer of the raw list: <UiIconPicker> (dashboard icon fields).
import { toIconName } from "./icons";
// Build-generated from @iconify-json packages (modules/icon-metadata.ts).
import { generatedIcons } from "#build/icon-metadata";

export interface IconMetadata {
  name: string;
  displayName: string;
  category: string;
}

// Hand-curated legacy set — every name a DB value could already hold,
// kept verbatim so old entries keep rendering. New icons come from the
// generated list below.
export const curatedIcons: IconMetadata[] = [
  { name: "FaCode", displayName: "Code", category: "Development" },
  { name: "FaTerminal", displayName: "Terminal", category: "Development" },
  { name: "FaBug", displayName: "Bug", category: "Development" },
  { name: "FaGitAlt", displayName: "Git", category: "Development" },
  { name: "FaFileAlt", displayName: "File", category: "Development" },
  { name: "FaFolder", displayName: "Folder", category: "Development" },
  { name: "FaBook", displayName: "Book", category: "Development" },
  { name: "FaPencilAlt", displayName: "Pencil", category: "Development" },
  { name: "FaServer", displayName: "Server", category: "Infrastructure" },
  { name: "FaCloud", displayName: "Cloud", category: "Infrastructure" },
  { name: "FaDatabase", displayName: "Database", category: "Infrastructure" },
  { name: "FaNetworkWired", displayName: "Network", category: "Infrastructure" },
  { name: "FaDocker", displayName: "Docker", category: "Infrastructure" },
  { name: "FaLinux", displayName: "Linux", category: "Infrastructure" },
  { name: "FaAws", displayName: "AWS", category: "Infrastructure" },
  { name: "FaShieldAlt", displayName: "Shield", category: "Infrastructure" },
  { name: "FaLock", displayName: "Lock", category: "Infrastructure" },
  { name: "FaUnlock", displayName: "Unlock", category: "Infrastructure" },
  { name: "FaKey", displayName: "Key", category: "Infrastructure" },
  { name: "FaTools", displayName: "Tools", category: "Tools" },
  { name: "FaCogs", displayName: "Cogs", category: "Tools" },
  { name: "FaCog", displayName: "Cog", category: "Tools" },
  { name: "FaWrench", displayName: "Wrench", category: "Tools" },
  { name: "FaFilter", displayName: "Filter", category: "Tools" },
  { name: "FaSearch", displayName: "Search", category: "Tools" },
  { name: "FaChartLine", displayName: "Chart Line", category: "Business" },
  { name: "FaChartBar", displayName: "Chart Bar", category: "Business" },
  { name: "FaChartPie", displayName: "Chart Pie", category: "Business" },
  { name: "FaProjectDiagram", displayName: "Project", category: "Business" },
  { name: "FaBriefcase", displayName: "Briefcase", category: "Business" },
  { name: "FaBuilding", displayName: "Building", category: "Business" },
  { name: "FaMoneyBill", displayName: "Money", category: "Business" },
  { name: "FaCreditCard", displayName: "Credit Card", category: "Business" },
  { name: "FaShoppingCart", displayName: "Shopping Cart", category: "Business" },
  { name: "FaRocket", displayName: "Rocket", category: "UI" },
  { name: "FaLightbulb", displayName: "Lightbulb", category: "UI" },
  { name: "FaHeart", displayName: "Heart", category: "UI" },
  { name: "FaStar", displayName: "Star", category: "UI" },
  { name: "FaFire", displayName: "Fire", category: "UI" },
  { name: "FaPalette", displayName: "Palette", category: "UI" },
  { name: "FaCamera", displayName: "Camera", category: "UI" },
  { name: "FaBell", displayName: "Bell", category: "UI" },
  { name: "FaFlag", displayName: "Flag", category: "UI" },
  { name: "FaTag", displayName: "Tag", category: "UI" },
  { name: "FaTags", displayName: "Tags", category: "UI" },
  { name: "FaCheckCircle", displayName: "Check Circle", category: "UI" },
  { name: "FaClock", displayName: "Clock", category: "UI" },
  { name: "FaThumbsUp", displayName: "Thumbs Up", category: "UI" },
  { name: "FaThumbsDown", displayName: "Thumbs Down", category: "UI" },
  { name: "FaEye", displayName: "Eye", category: "UI" },
  { name: "FaEyeSlash", displayName: "Eye Slash", category: "UI" },
  { name: "FaUsers", displayName: "Users", category: "Social" },
  { name: "FaUser", displayName: "User", category: "Social" },
  { name: "FaComment", displayName: "Comment", category: "Social" },
  { name: "FaComments", displayName: "Comments", category: "Social" },
  { name: "FaShare", displayName: "Share", category: "Social" },
  { name: "FaLink", displayName: "Link", category: "Social" },
  { name: "FaEnvelope", displayName: "Envelope", category: "Contact" },
  { name: "FaPhone", displayName: "Phone", category: "Contact" },
  { name: "FaMapMarkerAlt", displayName: "Map Marker", category: "Contact" },
  { name: "FaGlobe", displayName: "Globe", category: "Contact" },
  { name: "FaGraduationCap", displayName: "Graduation Cap", category: "Education" },
  { name: "FaCalendarAlt", displayName: "Calendar", category: "Education" },
  { name: "FaIdCard", displayName: "ID Card", category: "Education" },
  { name: "FaDesktop", displayName: "Desktop", category: "Devices" },
  { name: "FaLaptop", displayName: "Laptop", category: "Devices" },
  { name: "FaMobile", displayName: "Mobile", category: "Devices" },
  { name: "FaHome", displayName: "Home", category: "Lifestyle" },
  { name: "FaCar", displayName: "Car", category: "Lifestyle" },
  { name: "FaPlane", displayName: "Plane", category: "Lifestyle" },
  { name: "FaBicycle", displayName: "Bicycle", category: "Lifestyle" },
  { name: "FaCoffee", displayName: "Coffee", category: "Lifestyle" },
  { name: "FaPizzaSlice", displayName: "Pizza", category: "Lifestyle" },
  { name: "FaUtensils", displayName: "Utensils", category: "Lifestyle" },
  { name: "FaMusic", displayName: "Music", category: "Lifestyle" },
  { name: "FaGamepad", displayName: "Gamepad", category: "Lifestyle" },
  { name: "FaDownload", displayName: "Download", category: "Actions" },
  { name: "FaUpload", displayName: "Upload", category: "Actions" },
  { name: "SiTypescript", displayName: "TypeScript", category: "Brands" },
  { name: "SiJavascript", displayName: "JavaScript", category: "Brands" },
  { name: "SiReact", displayName: "React", category: "Brands" },
  { name: "SiNextdotjs", displayName: "Next.js", category: "Brands" },
  { name: "SiVuedotjs", displayName: "Vue.js", category: "Brands" },
  { name: "SiAngular", displayName: "Angular", category: "Brands" },
  { name: "SiNodedotjs", displayName: "Node.js", category: "Brands" },
  { name: "SiPython", displayName: "Python", category: "Brands" },
  { name: "SiDjango", displayName: "Django", category: "Brands" },
  { name: "SiFlask", displayName: "Flask", category: "Brands" },
  { name: "SiFastapi", displayName: "FastAPI", category: "Brands" },
  { name: "SiExpress", displayName: "Express", category: "Brands" },
  { name: "SiNestjs", displayName: "NestJS", category: "Brands" },
  { name: "SiHtml5", displayName: "HTML5", category: "Brands" },
  { name: "SiCss3", displayName: "CSS3", category: "Brands" },
  { name: "SiTailwindcss", displayName: "Tailwind CSS", category: "Brands" },
  { name: "SiPostgresql", displayName: "PostgreSQL", category: "Brands" },
  { name: "SiMongodb", displayName: "MongoDB", category: "Brands" },
  { name: "SiMysql", displayName: "MySQL", category: "Brands" },
  { name: "SiRedis", displayName: "Redis", category: "Brands" },
  { name: "SiGraphql", displayName: "GraphQL", category: "Brands" },
  { name: "SiDocker", displayName: "Docker", category: "Brands" },
  { name: "SiKubernetes", displayName: "Kubernetes", category: "Brands" },
  { name: "SiGithub", displayName: "GitHub", category: "Brands" },
  { name: "SiGitlab", displayName: "GitLab", category: "Brands" },
  { name: "SiJenkins", displayName: "Jenkins", category: "Brands" },
  { name: "SiTerraform", displayName: "Terraform", category: "Brands" },
  { name: "SiAnsible", displayName: "Ansible", category: "Brands" },
  { name: "SiPrometheus", displayName: "Prometheus", category: "Brands" },
  { name: "SiGrafana", displayName: "Grafana", category: "Brands" },
  { name: "SiElasticsearch", displayName: "Elasticsearch", category: "Brands" },
  { name: "SiNginx", displayName: "Nginx", category: "Brands" },
  { name: "SiApache", displayName: "Apache", category: "Brands" },
  { name: "SiAmazon", displayName: "AWS", category: "Brands" },
  { name: "SiGooglecloud", displayName: "Google Cloud", category: "Brands" },
  { name: "SiLinux", displayName: "Linux", category: "Brands" },
  { name: "SiUbuntu", displayName: "Ubuntu", category: "Brands" },
  { name: "SiDebian", displayName: "Debian", category: "Brands" },
  { name: "SiRedhat", displayName: "Red Hat", category: "Brands" },
  { name: "SiCentos", displayName: "CentOS", category: "Brands" },
  { name: "SiAndroid", displayName: "Android", category: "Brands" },
  { name: "SiApple", displayName: "Apple", category: "Brands" },
  { name: "SiSlack", displayName: "Slack", category: "Brands" },
  { name: "SiDiscord", displayName: "Discord", category: "Brands" },
  { name: "SiTrello", displayName: "Trello", category: "Brands" },
  { name: "SiJira", displayName: "Jira", category: "Brands" },
  { name: "SiConfluence", displayName: "Confluence", category: "Brands" },
  { name: "SiNotion", displayName: "Notion", category: "Brands" },
  { name: "SiFigma", displayName: "Figma", category: "Brands" },
  { name: "SiSketch", displayName: "Sketch", category: "Brands" },
];

// Generated FA6 entries that duplicate a curated glyph are dropped: each
// curated id blocks itself, and a legacy "fa:x" render also blocks
// "fa-solid:x" (same FA5/FA6 glyph).
const covered = new Set<string>();
for (const icon of curatedIcons) {
  const id = toIconName(icon.name);
  covered.add(id);
  if (id.startsWith("fa:")) covered.add(`fa-solid:${id.slice(3)}`);
}

export const iconMetadata: IconMetadata[] = [
  ...curatedIcons,
  ...generatedIcons.filter((icon) => !covered.has(toIconName(icon.name))),
];

export const iconCategories = Array.from(
  new Set(iconMetadata.map((icon) => icon.category)),
).sort();
