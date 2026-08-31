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
  return y ? y[1] : date;
}

const sorted = computed(() => [...props.items].sort((a, b) => quarterTime(b.date) - quarterTime(a.date)));
const years = computed(() => [...new Set(sorted.value.map((i) => yearOf(i.date)))].sort((a, b) => Number(b) - Number(a)));
const firstYear = computed(() => years.value[years.value.length - 1] ?? String(new Date().getFullYear()));
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
            :items="sorted.filter((i) => yearOf(i.date) === year)"
          />
        </template>
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
