-- Seed defaults for a freshly created database: the CMS singleton row
-- (homepage/about/roadmap/projects JSON), the default tool categories + skills,
-- and the public profile/status rows. INSERT OR IGNORE keeps re-runs harmless,
-- and d1_migrations tracking means this applies exactly once per database.
-- Values mirror the runtime fallbacks in server/utils/cms-defaults.ts and
-- server/api/home-settings.get.ts — the APIs self-heal if a row goes missing;
-- this seed just makes dashboards edit real rows from day one.
-- NOTE: SQL string literals double single quotes ('' → '), and backslashes in
-- the JSON are intentional (the hero title carries literal \n / \\ markup).

INSERT OR IGNORE INTO CmsSettings (id, homepage, about, roadmap, projects, createdAt, updatedAt) VALUES (
  'default',
  '{"hero":{"title":"Hi, I''m Lakshan.\\n\\\\I build software for people.\\\\","description":"Turning complex requirements into fast code, automated pipelines, and zero-downtime deployments.","primaryButtonText":"$ inspect --work","primaryButtonLink":"/projects","secondaryButtonText":"$ contact --now","secondaryButtonLink":"/about#contact","imageUrl":"/myself.jpeg"}}',
  '{"hero":{"profileImage":"/myself.jpeg","terminalBio":["$ uptime","> usually building something","$ cat /etc/motd","> break, fix, repeat — ship small, log everything","$ tail -f /var/log/life.log","> new entries daily","$ git log --oneline --reverse | tail -1","> initial commit — still pushing"]}}',
  '{"hero":{"title":"career.log","description":"every entry, from fun hobby to life career."}}',
  '{"hero":{"title":"the full registry.","tagline":"everything i’ve built, designed,\nshipped, tested, or failed at."}}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO Profile (id, name, title, bio, email, profileImage, githubUrl, linkedinUrl, phone, whatsappUrl, createdAt, updatedAt) VALUES
  (
    'default',
    'J Avindu Lakshan De Silva',
    'junior full-stack & cloud engineer',
    'Passionate developer with expertise in building scalable applications and managing cloud infrastructure. Specialized in React, Next.js, and modern DevOps practices.',
    'lakshandesilva112@gmail.com',
    '/myself.jpeg',
    'https://github.com/lakshanDS',
    'https://linkedin.com/in/lakshandesilva',
    '+94717678199',
    'https://wa.me/+94717678199',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT OR IGNORE INTO ProfileStatus (id, isOpenToWork, updatedAt) VALUES
  ('default', 0, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO SkillCategory (id, name, icon, displayOrder, createdAt, updatedAt) VALUES
  ('cat-infra', 'cloud & infrastructure', 'FaCloud', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat-dev', 'development', 'FaCode', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat-monitoring', 'monitoring', 'FaChartLine', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO Skill (id, categoryId, name, icon, iconColor, displayOrder, createdAt, updatedAt) VALUES
  ('skill-docker', 'cat-infra', 'Docker', 'SiDocker', '#2496ED', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('skill-kubernetes', 'cat-infra', 'Kubernetes', 'SiKubernetes', '#326CE5', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('skill-terraform', 'cat-infra', 'Terraform', 'SiTerraform', '#7B42BC', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('skill-aws', 'cat-infra', 'AWS', 'FaAws', '#FF9900', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('skill-linux', 'cat-infra', 'Linux', 'FaLinux', '#FCC624', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('skill-ansible', 'cat-infra', 'Ansible', 'SiAnsible', '#EE0000', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('skill-nginx', 'cat-infra', 'Nginx', 'SiNginx', '#009639', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('skill-git', 'cat-dev', 'Git', 'FaGitAlt', '#F05032', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('skill-ghactions', 'cat-dev', 'GitHub Actions', 'SiGithubactions', '#2088FF', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('skill-python', 'cat-dev', 'Python', 'SiPython', '#3776AB', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('skill-nuxt', 'cat-dev', 'Nuxt', 'SiNuxtdotjs', '#00DC82', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('skill-vue', 'cat-dev', 'Vue', 'SiVuedotjs', '#42B883', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('skill-postgres', 'cat-dev', 'PostgreSQL', 'SiPostgresql', '#4169E1', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('skill-prometheus', 'cat-monitoring', 'Prometheus', 'SiPrometheus', '#E6522C', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('skill-grafana', 'cat-monitoring', 'Grafana', 'SiGrafana', '#F46800', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
