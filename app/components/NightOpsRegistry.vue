<script setup lang="ts">
// Sonar scope
// head with live filters, documented systems as full-width dossier cards,
// the rest reuse the homepage work cards, hire CTA closes the page.
import { initialsFor, statusFor } from "~/utils/projects";

type RegistryProject = {
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
  displayOrder?: number;
};

type ScopeBlip = { id: number; x: number; y: number };

const props = defineProps<{
  projects: RegistryProject[];
  profile: { email?: string; githubUrl?: string; linkedinUrl?: string; whatsappUrl?: string } | null;
  available: boolean;
  // editable in the projects console (CmsSettings.projects.hero)
  title?: string;
  tagline?: string;
}>();

const headTitle = computed(() => props.title ?? "");
const headTaglineLines = computed(() => (props.tagline ?? "").split(/\\n|\n/));

// sonar contacts: bursts of 1-3 at random points in the scope disc,
// quiet gaps between bursts; each blip fades itself out via CSS.
const blips = ref<ScopeBlip[]>([]);
let stopPings: (() => void) | null = null;

onMounted(() => {
  let loopTimer: ReturnType<typeof setTimeout> | undefined;
  const spawnTimers: ReturnType<typeof setTimeout>[] = [];

  const spawn = () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * 295; // uniform over the disc
    const blip = { id: Date.now() + Math.random(), x: 310 + Math.cos(angle) * radius, y: 310 + Math.sin(angle) * radius };
    blips.value = [...blips.value, blip];
    spawnTimers.push(
      setTimeout(() => {
        blips.value = blips.value.filter((p) => p.id !== blip.id);
      }, 3200),
    );
  };
  const burst = () => {
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) spawnTimers.push(setTimeout(spawn, i * 450));
  };
  const loop = () => {
    burst();
    loopTimer = setTimeout(loop, 1800 + Math.random() * 2200);
  };
  loop();

  stopPings = () => {
    clearTimeout(loopTimer);
    spawnTimers.forEach(clearTimeout);
  };
});
onUnmounted(() => stopPings?.());

const selected = ref("all");

const categories = computed(() => Array.from(new Set(props.projects.map((p) => p.category))));
const tally = computed(() => ({
  total: props.projects.length,
  operational: props.projects.filter((p) => {
    const st = statusFor(p.status);
    return !st.wip && !st.dimmed;
  }).length,
  shipping: props.projects.filter((p) => statusFor(p.status).wip).length,
  categories: categories.value.length,
  docs: props.projects.filter(hasDocs).length,
}));

const filtered = computed(() =>
  selected.value === "all" ? props.projects : props.projects.filter((p) => p.category === selected.value),
);
// first two by order are the featured dossiers, the rest go to the work cards
const featured = computed(() => filtered.value.slice(0, 2));
const rest = computed(() => filtered.value.slice(2));
const registryIndex = (p: RegistryProject) => props.projects.indexOf(p) + 1;
// stable registry numbers for the work cards (they'd otherwise renumber per filter)
const numbers = computed(() => Object.fromEntries(props.projects.map((p, i) => [p.id, String(i + 1).padStart(2, "0")])));

function hasDocs(project: RegistryProject) {
  return Boolean(project.content?.trim());
}

// first markdown paragraph for the readme strip — links collapse to
// their label so the excerpt reads clean
function docExcerpt(markdown: string) {
  const paragraph = markdown
    .replace(/^#+\s.*$/gm, "")
    .trim()
    .split(/\n\s*\n/)[0] ?? "";
  const text = paragraph
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>[\]()#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 230 ? `${text.slice(0, 230).trimEnd()}…` : text;
}

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

const statusTone = (st: { wip: boolean; dimmed: boolean }) =>
  st.dimmed ? "text-dim" : st.wip ? "text-amber" : "text-phosphor";
const dotTone = (st: { wip: boolean; dimmed: boolean }) =>
  st.dimmed ? "bg-dim" : st.wip ? "animate-pulse bg-amber" : "bg-phosphor";
</script>

<template>
  <div class="relative">
    <!-- registry head — sonar scope behind the title, anchored to the content column -->
    <header class="relative overflow-hidden border-b border-line">
      <div class="relative mx-auto max-w-[1200px] px-[36px] pt-10 max-md:px-6">
        <div aria-hidden="true" class="ops-glow" />
        <div aria-hidden="true" class="registry-scope">
          <i />
          <i />
          <i />
          <span class="cross-h" />
          <span class="cross-v" />
          <span
            v-for="blip in blips"
            :key="blip.id"
            class="blip"
            :style="{ left: `${blip.x}px`, top: `${blip.y}px` }"
          />
        </div>

        <div data-reveal class="mb-[18px] font-mono text-[12px] uppercase tracking-[0.22em] text-amber">
          // ~/work --all
        </div>
        <div data-reveal class="flex items-end justify-between gap-6 max-md:flex-col max-md:items-start">
          <h1 class="text-[clamp(2.2rem,4.5vw,3.4rem)] font-bold leading-[1.05] tracking-[-0.02em] text-bright">
            {{ headTitle }}
            <span class="block font-normal text-dim">
              <span v-for="(line, i) in headTaglineLines" :key="i" class="block">{{ line }}</span>
            </span>
          </h1>
          <div class="whitespace-nowrap text-right font-mono text-[11.5px] leading-8 tracking-[0.08em] text-dim max-md:text-left">
            <b class="font-medium text-phosphor">{{ tally.total }}</b> entries ·
            <b class="font-medium text-phosphor">{{ tally.operational }}</b> operational ·
            <em class="not-italic text-amber">{{ tally.shipping }}</em> shipping
            <br />
            {{ tally.categories }} categories · {{ tally.docs }} with full docs
          </div>
        </div>

        <nav aria-label="registry filters" data-reveal class="flex flex-wrap gap-2 pb-[34px] pt-[30px]">
          <button
            v-for="cat in ['all', ...categories]"
            :key="cat"
            type="button"
            :aria-pressed="selected === cat"
            class="border px-3.5 py-[7px] font-mono text-[12px] transition-colors"
            :class="
              selected === cat
                ? 'border-phosphor bg-phosphor/10 text-phosphor'
                : 'border-line text-dim hover:border-dim hover:text-bright'
            "
            @click="selected = cat"
          >
            {{ cat.toLowerCase() }} <span class="opacity-55">{{
              cat === "all" ? props.projects.length : props.projects.filter((p) => p.category === cat).length
            }}</span>
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-[1200px] px-[36px] max-md:px-6">
      <section class="flex flex-col gap-[18px] pt-[34px]">
        <article
          v-for="project in featured"
          :key="project.id"
          data-reveal
          class="group flex min-w-0 flex-col gap-3 border border-line bg-panel/55 p-5 pb-4 transition-[border-color,transform] duration-200 hover:-translate-y-[3px] hover:border-phosphor/55"
        >
          <div class="flex items-center justify-between">
            <span
              class="flex items-center gap-[7px] font-mono text-[11px] uppercase tracking-[0.12em]"
              :class="statusTone(statusFor(project.status))"
            >
              <i class="h-1.5 w-1.5 rounded-full" :class="dotTone(statusFor(project.status))" />
              {{ statusFor(project.status).label }}
            </span>
            <span class="font-mono text-[11px] uppercase tracking-[0.12em] text-amber">featured</span>
            <span class="font-mono text-[11px] text-dim">{{ String(registryIndex(project)).padStart(2, "0") }}</span>
          </div>

          <div class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_420px] gap-[22px] max-lg:grid-cols-1">
            <div class="flex min-w-0 flex-col gap-3">
              <h3 class="text-[1.3rem] font-medium text-bright">{{ project.title }}</h3>
              <p class="max-w-[70ch] font-mono text-[0.84rem] leading-[1.6] text-dim">{{ project.description }}</p>

              <div v-if="hasDocs(project)" class="border border-line bg-[#0D0D0F]">
                <div class="flex justify-between border-b border-line px-3.5 py-[7px] font-mono text-[10.5px] uppercase tracking-[0.14em] text-dim">
                  <span>{{ project.id }}/readme.md</span>
                  <span>markdown · rendered</span>
                </div>
                <p class="relative px-4 pb-3 pt-3 font-mono text-[12px] leading-[1.65] text-text-secondary after:absolute after:inset-x-0 after:bottom-0 after:h-[22px] after:bg-gradient-to-b after:from-transparent after:to-[#0D0D0F]">
                  {{ docExcerpt(project.content ?? "") }}
                </p>
              </div>

              <div class="mt-auto flex min-w-0 items-center justify-between gap-2.5 border-t border-line pt-3">
                <div class="min-w-0 flex-1 overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,black_80%,transparent)]">
                  <div class="flex gap-1.5">
                    <span
                      v-for="tag in project.tags.slice(0, 8)"
                      :key="tag"
                      class="shrink-0 border border-line px-2 py-[3px] font-mono text-[10.5px] uppercase tracking-[0.06em] text-dim"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <div class="relative z-10 flex shrink-0 items-center gap-3.5">
                  <a
                    v-if="project.demoUrl"
                    :href="project.demoUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-mono text-[12px] text-dim transition-colors hover:text-bright"
                  >
                    {{ hostnameOf(project.demoUrl) }} ↗
                  </a>
                  <NuxtLink
                    v-if="hasDocs(project)"
                    :to="`/projects/${project.id}`"
                    class="border border-phosphor/55 px-3.5 py-1.5 font-mono text-[12px] text-phosphor transition-colors hover:bg-phosphor/10"
                  >
                    read the docs →
                  </NuxtLink>
                </div>
              </div>
            </div>

            <div class="relative min-h-[250px] overflow-hidden border border-line bg-[#0D0D0F] max-lg:min-h-[220px]">
              <img
                v-if="project.imageUrl"
                :src="project.imageUrl"
                :alt="`${project.title} — system screen`"
                class="absolute inset-0 h-full w-full object-cover"
              />
              <div
                v-else
                class="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_90%_70%_at_50%_20%,rgba(74,222,128,0.08),transparent_60%)] font-mono text-[2.6rem] font-bold text-phosphor/45"
              >
                {{ initialsFor(project.title) }}
              </div>
              <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(74,222,128,0.06),transparent_38%,rgba(10,10,11,0.5))]" />
              <span aria-hidden class="absolute -left-px -top-px h-[9px] w-[9px] border-l-2 border-t-2 border-phosphor" />
              <span aria-hidden class="absolute -bottom-px -right-px h-[9px] w-[9px] border-b-2 border-r-2 border-phosphor" />
            </div>
          </div>
        </article>
      </section>

      <template v-if="rest.length > 0">
        <div data-reveal class="mb-[22px] mt-[46px] flex items-baseline justify-between border-b border-line pb-3">
          <h2 class="text-[1.3rem] font-medium text-bright">
            <span class="font-mono text-phosphor">// </span>
            remaining systems
          </h2>
          <span class="font-mono text-[12px] text-dim">
            {{ String(rest.length).padStart(2, "0") }} entries
          </span>
        </div>
        <NightOpsWork :projects="rest" headerless :numbers="numbers" />
      </template>
    </main>

    <NightOpsContact :profile="props.profile" :available="props.available" />
  </div>
</template>
