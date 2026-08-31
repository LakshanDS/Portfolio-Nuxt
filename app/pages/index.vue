<script setup lang="ts">
import { statusFor } from "~/utils/projects";
type Project = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: string;
  imageUrl?: string | null;
  demoUrl?: string | null;
  repoUrl?: string | null;
  content?: string | null;
};

type FeaturedBeat = { label: string; text: string };

type HomeSettings = {
  hero?: Record<string, string>;
  sections?: Record<string, { enabled?: boolean }>;
  featured?: {
    projectId?: string;
    kicker?: string;
    statusLine?: string;
    sub?: string;
    logo?: string;
    beats?: FeaturedBeat[];
  };
  strip?: {
    projectId?: string;
    kicker?: string;
    stats?: { value: string; label: string }[];
  };
};

type AboutData = {
  profile: { name: string; email?: string; githubUrl?: string; linkedinUrl?: string } | null;
  isOpenToWork: boolean;
  competencies: { id: string; title: string; description: string; expertise: string; tags: string[] }[];
};

const [{ data: homeSettings }, { data: about }, { data: projects }, { data: roadmap }, { data: tools }] =
  await Promise.all([
    useFetch<HomeSettings>("/api/home-settings"),
    useFetch<AboutData>("/api/about"),
    useFetch<Project[]>("/api/projects"),
    useFetch("/api/roadmap"),
    useFetch("/api/tools"),
  ]);

// hero copy comes from the API, which always returns server defaults
const hero = computed(() => homeSettings.value?.hero ?? {});
const sections = computed(() => homeSettings.value?.sections ?? {});

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

const featuredSettings = computed(() => homeSettings.value?.featured);
const stripSettings = computed(() => homeSettings.value?.strip);
const featuredProject = computed(() =>
  projects.value?.find((p) => p.id === featuredSettings.value?.projectId),
);
const stripProject = computed(() =>
  projects.value?.find((p) => p.id === stripSettings.value?.projectId),
);

// flagship frame — identity/links come from the project record, the
// homepage-specific copy (kicker, status line, tagline, beats) from settings
const feature = computed(() => {
  const p = featuredProject.value;
  const f = featuredSettings.value;
  if (!p || !f) return null;
  const actions: { label: string; href: string; kind: "live" | "doc"; external?: boolean }[] = [];
  if (p.demoUrl) actions.push({ label: "live ↗", href: p.demoUrl, kind: "live", external: true });
  actions.push({ label: "documentation", href: `/projects/${p.id}`, kind: "doc" });
  return {
    id: p.id,
    kicker: f.kicker || p.category,
    status: f.statusLine || statusFor(p.status).label,
    name: p.title,
    sub: f.sub || p.description,
    subLink: p.demoUrl ? { label: hostOf(p.demoUrl), href: p.demoUrl } : null,
    logo: { src: f.logo || p.imageUrl || "", alt: p.title },
    actions,
    beats: (f.beats ?? []).filter((b) => b.text?.trim()),
  };
});

const strip = computed(() => {
  const p = stripProject.value;
  const s = stripSettings.value;
  if (!p || !s) return undefined;
  return {
    id: p.id,
    kicker: s.kicker || p.category,
    title: p.title,
    description: p.description,
    tags: p.tags,
    repoUrl: p.repoUrl,
    demoUrl: p.demoUrl,
    logo: p.imageUrl ?? undefined,
    stats: (s.stats ?? []).filter((stat) => stat.value?.trim()),
  };
});

const workProjects = computed(() =>
  (projects.value ?? [])
    .filter((p) => p.id !== featuredProject.value?.id && p.id !== stripProject.value?.id)
    .slice(0, 6),
);
</script>

<template>
  <div class="relative">
    <div class="mx-auto max-w-[1200px] px-[36px] max-md:px-6">
      <NightOpsHero
        :settings="hero"
        :is-open-to-work="about?.isOpenToWork ?? false"
        :operator-name="about?.profile?.name ?? 'Lakshan De Silva'"
      />

      <NightOpsTools v-if="sections.toolsOfTrade?.enabled !== false" :tools="tools ?? []" />

      <!-- flagship story — reads its long-form doc from the registry -->
      <NightOpsFeature
        v-if="feature"
        :feature="feature"
        :content="featuredProject?.content ?? null"
        :strip="strip"
      />

      <NightOpsWork v-if="sections.projects?.enabled !== false" :projects="workProjects" />

      <NightOpsCareerLog
        v-if="sections.roadmap?.enabled !== false"
        :items="(roadmap as any) ?? []"
        :is-open-to-work="about?.isOpenToWork ?? false"
      />

      <NightOpsExpertise
        v-if="sections.competencies?.enabled !== false"
        :competencies="about?.competencies ?? []"
      />

      <NightOpsContact
        v-if="sections.cta?.enabled !== false"
        :profile="about?.profile ?? null"
        :available="about?.isOpenToWork ?? false"
      />
    </div>
  </div>
</template>
