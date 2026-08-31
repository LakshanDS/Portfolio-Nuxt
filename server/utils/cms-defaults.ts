// Single source for CMS settings defaults — imported by the settings GET/POST
// handlers. GETs merge these over saved rows; ?defaults=1 returns them raw.

// Public profile defaults — served by the profile APIs when the DB is empty or
// unavailable, so contact links render without a database. Public fields only.
export const defaultProfile = {
  name: "J Avindu Lakshan De Silva",
  title: "junior full-stack & cloud engineer",
  bio: "Passionate developer with expertise in building scalable applications and managing cloud infrastructure. Specialized in React, Next.js, and modern DevOps practices.",
  email: "lakshandesilva112@gmail.com",
  githubUrl: "https://github.com/lakshanDS",
  linkedinUrl: "https://linkedin.com/in/lakshandesilva",
  whatsappUrl: "https://wa.me/+94717678199",
  phone: "+94717678199",
  profileImage: "/myself.jpeg",
};

export const defaultAboutSettings = {
  hero: {
    profileImage: "/myself.jpeg",
    terminalBio: [
      "$ uptime",
      "> usually building something",
      "$ tail -f /var/log/life.log",
      "> new entries daily",
      "$ cat /etc/motd",
      "> break, fix, repeat — ship small, log everything",
      "$ git log --oneline --reverse | tail -1",
      "> initial commit — still pushing",
    ],
  },
};

export const defaultProjectsSettings = {
  hero: {
    title: "the full registry.",
    tagline: "everything i’ve built, designed,\nshipped, tested, or failed at.",
  },
};

export const defaultRoadmapSettings = {
  hero: {
    title: "career.log",
    description: "every entry, from fun hobby to life career.",
  },
};

export const defaultHomepageSettings = {
  hero: {
    title: "Hi, I'm Lakshan.\\n\\\\I build software for people.\\\\",
    description:
      "Turning complex requirements into fast code, automated pipelines, and zero-downtime deployments.",
    primaryButtonText: "$ inspect --work",
    primaryButtonLink: "/projects",
    secondaryButtonText: "$ contact --now",
    secondaryButtonLink: "/about#contact",
    imageUrl: "/myself.jpeg",
  },
};
