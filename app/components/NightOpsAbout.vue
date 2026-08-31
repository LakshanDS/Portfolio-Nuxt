<script setup lang="ts">
/**
 * Night-ops about page — /about, the dossier the nav points at.
 * Terminal bio hero, one stats readout line, field notes (principles),
 * the service record panel, and the shared hire-the-operator CTA closing.
 */

type AboutProfile = {
  name: string;
  title: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
};

type AboutStats = {
  pipelinesFixed: string;
  projectsCount: number;
  selfCommits: number;
  experience: string;
  resumeDownloads: number;
};

type AboutCard = { id: string; title: string; content: string };

type AboutEducation = {
  id: string;
  title: string;
  institution: string;
  description: string;
  startDate: string;
  endDate: string;
};

type AboutExperience = {
  id: string;
  position: string;
  company: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
};

const props = defineProps<{
  profile: AboutProfile | null;
  available: boolean;
  stats: AboutStats | null;
  cards: AboutCard[];
  education: AboutEducation[];
  experience: AboutExperience[];
  terminalBio: string[];
  profileImage: string;
}>();

const NOTE_GLYPHS = ["✦", "◍", "△", "✓"];

// live operator clock — asia/colombo; placeholder until mounted so
// server and client markup agree on first paint
const clock = ref("--:--:--");
onMounted(() => {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const tick = () => (clock.value = fmt.format(new Date()));
  tick();
  const id = setInterval(tick, 1000);
  onUnmounted(() => clearInterval(id));
});

const operatorName = computed(() => props.profile?.name ?? "J Avindu Lakshan De Silva");
const operatorTitle = computed(() => props.profile?.title ?? "junior full-stack & cloud engineer");
const bioLines = computed(() => props.terminalBio);

// "$ cmd" lines render as prompt + command; "> out" lines strip the marker
function bioText(line: string): string {
  return line.startsWith(">") ? line.slice(1).trim() : line;
}
</script>

<template>
  <div class="relative">
    <!-- whoami head -->
    <header class="relative overflow-hidden">
      <div class="ops-glow" aria-hidden="true" />
      <div class="relative mx-auto max-w-[1200px] px-[36px] pt-10 max-md:px-6">
        <div data-reveal class="mb-[18px] font-mono text-[12px] uppercase tracking-[0.22em] text-amber">// ~/about</div>
        <div data-reveal class="flex items-end justify-between gap-6 max-md:flex-col max-md:items-start">
          <h1 class="text-[clamp(2.2rem,4.5vw,3.4rem)] font-bold leading-[1.05] tracking-[-0.02em] text-bright">
            {{ operatorName }}<span class="block font-normal text-[clamp(1.4rem,2.6vw,2rem)] leading-tight text-dim">{{ operatorTitle }}</span>
          </h1>
          <div class="whitespace-nowrap text-right font-mono text-[11.5px] leading-8 tracking-[0.08em] text-dim max-md:text-left">
            <span class="inline-flex items-center gap-2" :class="available ? 'text-phosphor' : ''">
              <i
                class="h-[7px] w-[7px] rounded-full"
                :class="available ? 'animate-pulse bg-phosphor shadow-[0_0_10px_rgba(74,222,128,0.8)]' : 'bg-dim'"
              />
              <b class="font-medium">{{ available ? "open to opportunities" : "currently off-duty" }}</b>
            </span>
            <br />
            base · sri lanka · utc+5:30
            <br />
            operator local · {{ clock }}
          </div>
        </div>

        <!-- terminal bio + photo on file -->
        <div data-reveal class="mt-[34px] grid grid-cols-[1fr_280px] items-stretch gap-[26px] max-md:grid-cols-1">
          <div class="brackets border border-line bg-panel/55">
            <div class="flex justify-between border-b border-line px-[18px] py-3 font-mono text-[11.5px] uppercase tracking-[0.16em] text-dim">
              <span>root@portfolio: ~</span>
              <span>--bio</span>
            </div>
            <div class="px-[22px] py-[18px] font-mono text-[13.5px] leading-[2.05]">
              <template v-for="(line, index) in bioLines" :key="index">
                <div v-if="line.startsWith('$')">
                  <span class="text-phosphor">$ </span>
                  <span class="text-text-secondary">{{ line.slice(1).trim() }}</span>
                </div>
                <div v-else :class="bioText(line).includes('●') ? 'text-dim' : 'text-phosphor'">
                  {{ bioText(line) }}
                </div>
              </template>
              <div class="mt-1.5 flex items-center">
                <span class="text-phosphor">$&nbsp;</span>
                <span class="inline-block h-[1em] w-[0.52em] -translate-y-[1px] animate-pulse bg-phosphor shadow-[0_0_14px_rgba(74,222,128,0.55)]" />
              </div>
            </div>
          </div>

          <figure class="brackets m-0 flex flex-col border border-line bg-panel/70">
            <div class="relative flex-1 overflow-hidden">
              <img
                :src="profileImage"
                :alt="operatorName"
                class="block aspect-square h-full w-full object-cover object-top grayscale contrast-110 brightness-90"
              />
              <div class="scanlines" />
            </div>
            <figcaption class="flex justify-between border-t border-line px-[18px] py-3 font-mono text-[11.5px] uppercase tracking-[0.16em] text-dim">
              <span>verified</span>
              <span class="text-phosphor">● rec</span>
            </figcaption>
          </figure>
        </div>

        <!-- stats readout -->
        <div
          v-if="stats"
          data-reveal
          class="mb-[34px] mt-4 flex flex-wrap border border-dashed border-line bg-panel/40 px-[18px] py-3 font-mono text-[12.5px] tracking-[0.04em] text-dim"
        >
          <b class="font-medium text-phosphor">{{ stats.pipelinesFixed }}</b>&nbsp;pipelines fixed
          <i class="not-italic opacity-55 mx-2.5">·</i>
          <b class="font-medium text-phosphor">{{ String(stats.projectsCount).padStart(2, "0") }}</b>&nbsp;projects shipped
          <i class="not-italic opacity-55 mx-2.5">·</i>
          <b class="font-medium text-phosphor">{{ stats.selfCommits }}+</b>&nbsp;commits pushed
          <i class="not-italic opacity-55 mx-2.5">·</i>
          <em class="not-italic text-amber">{{ stats.experience }}</em>&nbsp;yrs in service
          <i class="not-italic opacity-55 mx-2.5">·</i>
          {{ stats.resumeDownloads }} resume pulls
        </div>

        <!-- hero end — inset divider, same as the homepage hero -->
        <div class="mt-[72px] border-b border-line" />
      </div>
    </header>

    <main class="mx-auto max-w-[1200px] px-[36px] max-md:px-6">
      <!-- principles — title + notes wrapped, closed by a border like the homepage sections -->
      <section class="border-b border-line py-16">
        <div data-reveal class="mb-[30px] flex items-baseline justify-between gap-4">
          <h2 class="text-[1.3rem] font-medium text-bright">
            <span class="font-mono text-phosphor">// </span>principles
          </h2>
          <span class="whitespace-nowrap font-mono text-[12px] text-dim">field notes · {{ cards.length }} entries</span>
        </div>
        <div class="grid grid-cols-4 gap-3.5 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <div
            v-for="(card, index) in cards"
            :key="card.id"
            data-reveal
            class="border border-line bg-panel/55 p-4 transition-[border-color,transform] duration-200 hover:-translate-y-[2px] hover:border-phosphor/50"
          >
            <div class="font-mono text-[15px] text-phosphor">{{ NOTE_GLYPHS[index % NOTE_GLYPHS.length] }}</div>
            <h3 class="mt-2.5 text-[1.02rem] font-semibold text-bright">{{ card.title }}</h3>
            <p class="mt-1.5 text-[0.88rem] text-dim">{{ card.content }}</p>
          </div>
        </div>
      </section>

      <!-- service record — same wrap as principles -->
      <section class="border-b border-line py-16">
        <div data-reveal class="mb-[30px] flex items-baseline justify-between gap-4">
          <h2 class="text-[1.3rem] font-medium text-bright">
            <span class="font-mono text-phosphor">// </span>service record
          </h2>
          <span class="whitespace-nowrap font-mono text-[12px] text-dim">roles {{ experience.length }} · training {{ education.length }}</span>
        </div>
        <div data-reveal>
          <NightOpsServiceRecord :experience="experience" :education="education" />
        </div>
      </section>

      <!-- hire the operator — shared closing CTA -->
      <NightOpsContact :profile="profile" :available="available" />
    </main>
  </div>
</template>
