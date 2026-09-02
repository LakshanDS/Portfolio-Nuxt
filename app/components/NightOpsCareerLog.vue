<script setup lang="ts">
type LogItem = {
  id: string;
  title: string;
  description: string;
  date: string; // "Q1 2024" style quarter strings
  status: string;
  category?: string;
};

const props = defineProps<{
  items: LogItem[];
  isOpenToWork?: boolean;
}>();

// left-rail identity/trajectory copy — edit here
const OPERATOR = [
  { k: "role", v: "full-stack · devops · cloud" },
  { k: "base", v: "sri lanka · utc+5:30" },
  { k: "active since", v: "2024" },
  { k: "learning style", v: "break, fix, repeat" },
];

/** Parse "Q1 2024" (and plain years) into a comparable timestamp. */
function quarterTime(date: string): number {
  const q = date.match(/Q([1-4])\s+(\d{4})/i);
  if (q) return Number(q[2]) * 4 + Number(q[1]);
  const y = date.match(/(\d{4})/);
  return y ? Number(y[1]) * 4 : 0;
}

function yearOf(date: string): string {
  const y = date.match(/(\d{4})/);
  return y ? y[1] ?? date : date;
}

const sorted = computed(() => [...props.items].sort((a, b) => quarterTime(b.date) - quarterTime(a.date)));

// section always shows the 3 most recent years — first two collapse to 2
// entries, the last to 1. every "view 3 more" and the section --more reveal
// BATCH entries; a second --more click goes to /roadmap
const YEARS_SHOWN = 3;
const COLLAPSED = 2;
const LAST_COLLAPSED = 1;
const BATCH = 3;

const allYears = computed(() =>
  [...new Set(sorted.value.map((i) => yearOf(i.date)))].sort((a, b) => Number(b) - Number(a)),
);
const visibleYears = computed(() => allYears.value.slice(0, YEARS_SHOWN));
const collapsedFor = (index: number) => (index === YEARS_SHOWN - 1 ? LAST_COLLAPSED : COLLAPSED);

const counts = ref(visibleYears.value.map((_, index) => collapsedFor(index)));
function expandYear(index: number) {
  const current = counts.value[index] ?? collapsedFor(index);
  counts.value[index] = Math.min(current + BATCH, collapsedFor(index) + BATCH);
}

const shownCount = computed(() =>
  visibleYears.value.reduce((sum, year, index) => {
    const yearItems = sorted.value.filter((i) => yearOf(i.date) === year).length;
    return sum + Math.min(counts.value[index] ?? 0, yearItems);
  }, 0),
);
const hiddenCount = computed(() => sorted.value.length - shownCount.value);

let moreExpanded = false;
function onMore() {
  if (moreExpanded) {
    navigateTo("/roadmap");
  } else {
    moreExpanded = true;
    expandYear(YEARS_SHOWN - 1);
  }
}
// header range always reflects the full log, not the visible slice
const firstYear = computed(() => {
  const all = [...new Set(sorted.value.map((i) => yearOf(i.date)))].sort((a, b) => Number(b) - Number(a));
  return all[all.length - 1] ?? String(new Date().getFullYear());
});
</script>

<template>
  <section id="career" class="career relative overflow-hidden border-b border-line py-16">
    <div aria-hidden class="pings">
      <span />
      <span />
      <span />
    </div>

    <div class="relative mb-[30px] flex items-baseline justify-between" data-reveal>
      <h2 class="text-[1.3rem] font-medium text-bright">
        <span class="font-mono text-phosphor">// </span>
        career.log --short
      </h2>
      <NuxtLink to="/roadmap" class="font-mono text-[12.5px] text-dim transition-colors hover:text-phosphor">
        --all →
      </NuxtLink>
    </div>

    <div class="relative grid grid-cols-[1.2fr_.8fr] items-start gap-12 max-md:grid-cols-1">
      <div data-reveal class="brackets relative overflow-hidden border border-line bg-panel/55">
        <div class="flex justify-between border-b border-line px-[18px] py-3 font-mono text-[11.5px] uppercase tracking-[0.16em] text-dim">
          <span>release notes</span>
          <span>{{ firstYear }} → {{ new Date().getFullYear() }}</span>
        </div>

        <template v-for="(year, yi) in visibleYears" :key="year">
          <CareerYearBlock
            :year="year"
            :is-current-year="Number(year) === new Date().getFullYear()"
            :is-first="yi === 0"
            :items="sorted.filter((i) => yearOf(i.date) === year)"
            :collapsed="collapsedFor(yi)"
            :visible-count="counts[yi] ?? 0"
            :show-buttons="yi < YEARS_SHOWN - 1"
            @more="expandYear(yi)"
            @less="counts[yi] = collapsedFor(yi)"
          />
        </template>

        <div v-if="hiddenCount > 0" class="mx-[18px] mb-3 mt-1 border-t border-dashed border-line pt-2.5">
          <button
            type="button"
            class="block w-full border border-dashed border-line py-1.5 text-center font-mono text-[11.5px] text-dim transition-colors hover:border-phosphor/50 hover:text-phosphor"
            @click="onMore"
          >
            --more +{{ BATCH }} · {{ hiddenCount }} hidden · <span class="text-phosphor/70">--all →</span>
          </button>
        </div>
      </div>

      <div data-reveal style="--reveal-delay: 120ms">
        <h3 class="text-[1.3rem] font-medium text-bright">how i got here</h3>
        <p class="mt-3 text-[0.98rem] text-dim">
          Learned it the slow way: a cheap VPS, root access, and no idea what
          I was doing. Broke plenty, fixed more, still going.
        </p>

        <div class="mt-7 border border-line bg-panel/55">
          <div class="flex items-center justify-between border-b border-line px-[14px] py-[9px] font-mono text-[10.5px] uppercase tracking-[0.16em] text-dim">
            <span>operator profile</span>
            <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-phosphor" />
          </div>
          <div class="px-[14px] pb-2 pt-1">
            <div
              v-for="row in OPERATOR"
              :key="row.k"
              class="flex justify-between gap-3 border-b border-dashed border-line py-1.5 font-mono text-[12px] last:border-b-0"
            >
              <span class="text-dim">{{ row.k }}</span>
              <span class="text-right text-bright">{{ row.v }}</span>
            </div>
            <div class="flex justify-between gap-3 py-1.5 font-mono text-[12px]">
              <span class="text-dim">status</span>
              <span :class="props.isOpenToWork ? 'text-phosphor' : 'text-bright'">
                {{ props.isOpenToWork ? "open to work" : "heads down building" }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-[26px] grid grid-cols-2 gap-3.5">
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            class="border border-line px-[14px] py-3 text-center font-mono text-[13.5px] text-text-secondary transition-colors hover:border-dim"
          >
            $ wget resume.pdf
          </a>
          <a
            href="#contact"
            class="border border-phosphor px-[14px] py-3 text-center font-mono text-[13.5px] text-phosphor transition-colors hover:bg-phosphor/10"
          >
            contact --now
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
