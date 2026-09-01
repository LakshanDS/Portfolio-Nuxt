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

// section loads CAP entries; --more reveals BATCH once, then goes to /roadmap
const CAP = 6;
const BATCH = 2;
const SCROLL_COLLAPSE_PX = 400; // scroll distance from extend point before auto-collapse
const visibleCount = ref(CAP);
const extended = ref(false);
// items within CAP render directly; the rest ride the career-collapse animation
const baseItems = computed(() => sorted.value.slice(0, CAP));
const extraItems = computed(() => sorted.value.slice(CAP, visibleCount.value));
const visibleItems = computed(() => sorted.value.slice(0, visibleCount.value));
const hiddenCount = computed(() => sorted.value.length - visibleItems.value.length);
function onMore() {
  if (!extended.value) {
    extended.value = true;
    visibleCount.value += BATCH;
  } else {
    navigateTo("/roadmap");
  }
}

// collapse the extension once the user scrolls away from where they opened it
let anchor = 0;
function onScroll() {
  if (Math.abs(window.scrollY - anchor) > SCROLL_COLLAPSE_PX) {
    extended.value = false;
    visibleCount.value = CAP;
  }
}
watch(visibleCount, (value) => {
  if (value > CAP) {
    anchor = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
  } else {
    window.removeEventListener("scroll", onScroll);
  }
});
onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));

const years = computed(() =>
  [...new Set(visibleItems.value.map((i) => yearOf(i.date)))].sort((a, b) => Number(b) - Number(a)),
);
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

        <template v-for="(year, yi) in years" :key="year">
          <CareerYearBlock
            :year="year"
            :is-current-year="Number(year) === new Date().getFullYear()"
            :is-first="yi === 0"
            :items="baseItems.filter((i) => yearOf(i.date) === year)"
            :overflow-items="extraItems.filter((i) => yearOf(i.date) === year)"
          />
        </template>

        <div v-if="hiddenCount > 0" class="mx-[18px] mb-3 mt-1 border-t border-dashed border-line pt-2.5">
          <button
            type="button"
            class="block w-full border border-dashed border-line py-1.5 text-center font-mono text-[11.5px] text-dim transition-colors hover:border-phosphor/50 hover:text-phosphor"
            @click="onMore"
          >
            --more +{{ Math.min(BATCH, hiddenCount) }} · {{ hiddenCount }} hidden · <span class="text-phosphor/70">--all →</span>
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
