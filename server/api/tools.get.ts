// Flat tool list for the home marquee — categories only set the admin grouping.
// Defaults live here: empty/unavailable DB still yields a common tool list,
// real rows from the dashboard replace them.
const defaultTools = [
  { id: "tool-docker", name: "Docker", icon: "SiDocker", iconColor: "#2496ED" },
  { id: "tool-kubernetes", name: "Kubernetes", icon: "SiKubernetes", iconColor: "#326CE5" },
  { id: "tool-terraform", name: "Terraform", icon: "SiTerraform", iconColor: "#7B42BC" },
  { id: "tool-aws", name: "AWS", icon: "FaAws", iconColor: "#FF9900" },
  { id: "tool-ghactions", name: "GitHub Actions", icon: "SiGithubactions", iconColor: "#2088FF" },
  { id: "tool-linux", name: "Linux", icon: "FaLinux", iconColor: "#FCC624" },
  { id: "tool-git", name: "Git", icon: "FaGitAlt", iconColor: "#F05032" },
  { id: "tool-ansible", name: "Ansible", icon: "SiAnsible", iconColor: "#EE0000" },
  { id: "tool-nginx", name: "Nginx", icon: "SiNginx", iconColor: "#009639" },
  { id: "tool-prometheus", name: "Prometheus", icon: "SiPrometheus", iconColor: "#E6522C" },
  { id: "tool-grafana", name: "Grafana", icon: "SiGrafana", iconColor: "#F46800" },
  { id: "tool-python", name: "Python", icon: "SiPython", iconColor: "#3776AB" },
  { id: "tool-nuxt", name: "Nuxt", icon: "SiNuxtdotjs", iconColor: "#00DC82" },
  { id: "tool-vue", name: "Vue", icon: "SiVuedotjs", iconColor: "#42B883" },
  { id: "tool-postgres", name: "PostgreSQL", icon: "SiPostgresql", iconColor: "#4169E1" },
];

export default defineEventHandler(async (event) => {
  try {
    const db = useDb(event);
    // categories by displayOrder,
    // skills by displayOrder within each category — replicate that grouping.
    const { results: categories } = await db
      .prepare(`SELECT id FROM SkillCategory ORDER BY displayOrder ASC`)
      .all<{ id: string }>();
    const { results: skills } = await db
      .prepare(`SELECT id, name, icon, iconColor, categoryId FROM Skill ORDER BY displayOrder ASC`)
      .all<{ id: string; name: string; icon: string | null; iconColor: string | null; categoryId: string }>();

    const tools = categories.flatMap((category) =>
      skills
        .filter((skill) => skill.categoryId === category.id)
        .map((row) => ({
          id: row.id,
          name: row.name,
          icon: row.icon ?? null,
          iconColor: row.iconColor ?? null,
        })),
    );

    return tools.length > 0 ? tools : defaultTools;
  } catch (error) {
    // DB unavailable (e.g. migrations not applied) — never blank the marquee
    console.error("Failed to load tools:", error);
    return defaultTools;
  }
});
