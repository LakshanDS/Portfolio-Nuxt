<script setup lang="ts">
type RoadmapItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  status: string;
  tags: string[];
};

const props = defineProps<{
  items: RoadmapItem[];
  profile: { email?: string; githubUrl?: string; linkedinUrl?: string; whatsappUrl?: string } | null;
  available: boolean;
  // hero copy comes from /api/roadmap-settings (server defaults)
  heroTitle?: string;
  heroSubtitle?: string;
}>();

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

function statusFor(status: string): {
  chip: string;
  mark: string;
  markCls: string;
  chipCls: string;
  rowCls: string;
} {
  const s = status.toLowerCase();
  if (s === "completed")
    return { chip: "shipped", mark: "✓", markCls: "text-phosphor", chipCls: "border-phosphor/50 text-phosphor", rowCls: "" };
  if (s === "in-progress")
    return { chip: "building", mark: "◆", markCls: "text-amber", chipCls: "border-amber/50 text-amber", rowCls: "" };
  return { chip: "queued", mark: "▸", markCls: "text-dim", chipCls: "border-line text-dim", rowCls: "opacity-60" };
}

const STATUS_FLAGS = [
  { st: "completed", label: "shipped" },
  { st: "in-progress", label: "building" },
  { st: "planned", label: "queued" },
];

const flagCls = (on: boolean, kind?: "warn" | "dim") =>
  `border px-3.5 py-[7px] font-mono text-[12px] transition-colors ${
    on
      ? kind === "warn"
        ? "border-amber bg-amber/10 text-amber"
        : kind === "dim"
          ? "border-dim bg-panel/90 text-text-secondary"
          : "border-phosphor bg-phosphor/10 text-phosphor"
      : "border-line text-dim hover:border-dim hover:text-bright"
  }`;

const currentYear = String(new Date().getFullYear());
const cats = ref(new Set<string>());
const sts = ref(new Set<string>());

// newest year first; within a year, oldest quarter first so each release
// reads as a chronological story (v2024: Q1 → Q4)
const sorted = computed(() =>
  [...props.items].sort((a, b) => {
    const yearDiff = Number(yearOf(b.date)) - Number(yearOf(a.date));
    if (yearDiff !== 0) return yearDiff;
    return quarterTime(a.date) - quarterTime(b.date);
  }),
);

// first nine log entries start with descriptions unfolded; clicking a row folds/unfolds
const open = ref(new Set(sorted.value.slice(0, 9).map((i) => i.id)));
const yearsWithItems = computed(() =>
  [...new Set(sorted.value.map((i) => yearOf(i.date)))].sort((a, b) => Number(b) - Number(a)),
);
// the current year always shows as "in development", even with nothing logged
const years = computed(() =>
  yearsWithItems.value.includes(currentYear) ? yearsWithItems.value : [currentYear, ...yearsWithItems.value],
);
const firstYear = computed(() => yearsWithItems.value[yearsWithItems.value.length - 1] ?? currentYear);

// one filter row: top-used categories inline, the rest behind a "+N" toggle
const MAX_INLINE_CATS = 4;
const categoriesByUse = computed(() => {
  const counts = new Map<string, number>();
  for (const item of props.items) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  // stable sort — equal counts keep first-seen (chronological) order
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([cat]) => cat);
});
const showAllCats = ref(false);
const categories = computed(() =>
  showAllCats.value ? categoriesByUse.value : categoriesByUse.value.slice(0, MAX_INLINE_CATS),
);
const hiddenCatCount = computed(() => Math.max(0, categoriesByUse.value.length - MAX_INLINE_CATS));
const tally = computed(() => ({
  shipped: props.items.filter((i) => i.status === "completed").length,
  building: props.items.filter((i) => i.status === "in-progress").length,
  queued: props.items.filter((i) => i.status === "planned").length,
}));

const matches = (item: RoadmapItem) =>
  (!cats.value.size || cats.value.has(item.category)) && (!sts.value.size || sts.value.has(item.status));
const visibleTotal = computed(() => sorted.value.filter(matches).length);

// all log lines of a year, status styling precomputed for the template
const yearEntries = (year: string) =>
  sorted.value.filter((i) => yearOf(i.date) === year).map((item) => ({ item, st: statusFor(item.status) }));
const visibleEntries = (year: string) => yearEntries(year).filter((e) => matches(e.item));

function toggleFlag(set: Set<string>, key: string) {
  const next = new Set(set);
  next.has(key) ? next.delete(key) : next.add(key);
  return next;
}
function toggleOpen(id: string) {
  const next = new Set(open.value);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
}
function resetFilters() {
  cats.value = new Set();
  sts.value = new Set();
}
</script>

<template>
  <div class="relative">
    <header class="relative overflow-hidden border-b border-line">
      <div class="relative mx-auto max-w-[1200px] px-[36px] pt-10 max-md:px-6">
        <div class="ops-glow" aria-hidden="true" />

        <div data-reveal class="relative mb-[18px] font-mono text-[12px] uppercase tracking-[0.22em] text-amber">
          // ~/career.log --all
        </div>
        <div data-reveal class="relative flex items-end justify-between gap-6 max-md:flex-col max-md:items-start">
          <h1 class="text-[clamp(2.2rem,4.5vw,3.4rem)] font-bold leading-[1.05] tracking-[-0.02em] text-bright">
            {{ props.heroTitle }}
            <span class="block font-normal text-dim">{{ props.heroSubtitle }}</span>
          </h1>
          <div class="whitespace-nowrap text-right font-mono text-[11.5px] leading-8 tracking-[0.08em] text-dim max-md:text-left">
            <b class="font-medium text-phosphor">{{ tally.shipped }}</b> shipped · <em class="not-italic text-amber">{{ tally.building }}</em> building · {{ tally.queued }} queued
            <br />
            {{ firstYear }} → {{ currentYear }} · {{ items.length }} entries
          </div>
        </div>

        <nav aria-label="changelog filters" data-reveal class="relative flex flex-wrap items-start gap-x-4 gap-y-2 pb-[30px] pt-[26px]">
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span class="mr-1 font-mono text-[12px] text-dim">
              filter <b class="font-medium text-phosphor">--category</b>
            </span>
            <button
              v-for="cat in categories"
              :key="cat"
              type="button"
              :aria-pressed="cats.has(cat)"
              :class="flagCls(cats.has(cat))"
              @click="cats = toggleFlag(cats, cat)"
            >
              --{{ cat }}
            </button>
            <button
              v-if="hiddenCatCount > 0"
              type="button"
              :aria-expanded="showAllCats"
              :class="flagCls(showAllCats, 'dim')"
              @click="showAllCats = !showAllCats"
            >
              {{ showAllCats ? "− less" : `+${hiddenCatCount}` }}
            </button>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <span class="mr-1 font-mono text-[12px] text-dim">
              <b class="font-medium text-phosphor">--status</b>
            </span>
            <template v-for="{ st, label } in STATUS_FLAGS" :key="st">
              <button
                type="button"
                :aria-pressed="sts.has(st)"
                :class="flagCls(sts.has(st), label === 'building' ? 'warn' : label === 'queued' ? 'dim' : undefined)"
                @click="sts = toggleFlag(sts, st)"
              >
                --{{ label }}
              </button>
            </template>
          </div>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-[1200px] px-[36px] max-md:px-6">
      <section class="pt-[30px]">
        <div data-reveal class="brackets relative border border-line bg-panel/55">
          <div class="flex justify-between border-b border-line px-[18px] py-3 font-mono text-[11.5px] uppercase tracking-[0.16em] text-dim">
            <span>release notes</span>
            <span>{{ firstYear }} → {{ currentYear }}</span>
          </div>

          <template v-for="(year, yi) in years" :key="year">
            <div
              v-if="visibleEntries(year).length > 0 || (year === currentYear && yearEntries(year).length === 0)"
              class="px-[18px] pt-[18px]"
              :class="yi === 0 ? '' : 'border-t border-dashed border-line'"
            >
              <div class="mb-1 flex items-center gap-3">
                <span class="border border-phosphor/45 px-2.5 py-0.5 font-mono text-[12.5px] font-bold text-phosphor">v{{ year }}</span>
                <span class="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                  {{ year === currentYear ? "in development" : "released" }}
                </span>
                <span v-if="year === currentYear" class="ml-auto animate-pulse font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
                  ● current
                </span>
              </div>

              <p v-if="yearEntries(year).length === 0" class="px-1 pb-4 pt-2 font-mono text-[12px] text-dim">
                no entries logged yet — the queue is open.
              </p>
              <ul v-else>
                <li v-for="entry in visibleEntries(year)" :key="entry.item.id" :class="entry.st.rowCls">
                  <button
                    type="button"
                    :aria-expanded="open.has(entry.item.id)"
                    class="flex w-full items-baseline gap-3 px-1 py-[9px] text-left font-mono transition-colors hover:bg-panel/70"
                    @click="open = toggleOpen(entry.item.id)"
                  >
                    <span class="shrink-0 text-[12px]" :class="entry.st.markCls">{{ entry.st.mark }}</span>
                    <span class="w-[52px] shrink-0 text-[10.5px] tracking-[0.08em] text-dim">{{ entry.item.date }}</span>
                    <span class="text-[13px] text-text-secondary">{{ entry.item.title.toLowerCase() }}</span>
                    <span class="ml-auto hidden shrink-0 text-[10px] uppercase tracking-[0.12em] text-dim min-[620px]:block">
                      {{ entry.item.category }}
                    </span>
                    <span class="shrink-0 border px-2 py-0.5 text-[10.5px]" :class="entry.st.chipCls">{{ entry.st.chip }}</span>
                  </button>

                  <div class="career-collapse" :style="{ gridTemplateRows: open.has(entry.item.id) ? '1fr' : '0fr' }">
                    <div>
                      <div class="pl-[88px] pr-4 max-md:pl-[64px]">
                        <p class="max-w-[62ch] pb-2.5 pt-0.5 text-[12.5px] leading-[1.65] text-dim">{{ entry.item.description }}</p>
                        <div v-if="entry.item.tags.length > 0" class="flex flex-wrap gap-1.5 pb-3.5">
                          <span v-for="tag in entry.item.tags" :key="tag" class="border border-line px-2 py-px font-mono text-[10.5px] text-dim">
                            {{ tag }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </template>

          <div v-if="items.length > 0 && visibleTotal === 0" class="px-[18px] py-6 text-center font-mono text-[12.5px] text-dim">
            no entries match this filter — <button type="button" class="text-phosphor underline decoration-dotted underline-offset-4" @click="resetFilters">reset ×</button>
          </div>

          <div class="mx-[18px] mt-2 flex flex-wrap justify-between gap-3 border-t border-dashed border-line py-3.5 font-mono text-[11.5px] text-dim">
            <span>
              — end of log · <b class="font-medium text-phosphor">{{ items.length }} entries</b> since {{ firstYear }} —
            </span>
            <span class="animate-pulse">// tail -f career.log …</span>
          </div>
        </div>
      </section>
    </main>

    <NightOpsContact :profile="profile" :available="available" />
  </div>
</template>
