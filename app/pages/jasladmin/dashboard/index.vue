<script setup lang="ts">
// Night Ops dashboard — data from GET /api/admin/dashboard: stat tiles,
// work-status toggle (POST /api/admin/status, optimistic with rollback),
// traffic area chart (inline SVG), visitor location map, recent
// comments scroller.
interface DashboardComment {
  id: string;
  name: string | null;
  email: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface DashboardData {
  counts: { projects: number; roadmap: number; resumeDownloads: number };
  status: { isOpenToWork: boolean };
  visits: Array<{ date: string; count: number }>;
  comments: DashboardComment[];
  locationStats: Array<{ country: string; count: number; percentage: number }>;
}

const toast = useToast();

const data = ref<DashboardData | null>(null);
const isLoading = ref(true);
const loadError = ref(false);
const togglingStatus = ref(false);

async function fetchData() {
  isLoading.value = true;
  loadError.value = false;
  try {
    // $fetch throws on non-2xx (401/500) — surfaced as the error panel below
    data.value = await $fetch<DashboardData>("/api/admin/dashboard");
  } catch (error) {
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchData);

async function toggleStatus() {
  if (!data.value || togglingStatus.value) return;
  togglingStatus.value = true;
  const newState = !data.value.status.isOpenToWork;

  // optimistic — flip the tile before the POST resolves
  data.value = { ...data.value, status: { ...data.value.status, isOpenToWork: newState } };

  try {
    await $fetch("/api/admin/status", { method: "POST", body: { isOpenToWork: newState } });
  } catch (error) {
    data.value = { ...data.value, status: { ...data.value.status, isOpenToWork: !newState } };
    toast.error("Failed to update work status");
  } finally {
    togglingStatus.value = false;
  }
}

// formatted with toLocaleDateString + the same options
const dayFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });
const monthFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

function fmtDate(date: string) {
  return dayFmt.format(new Date(date));
}

function relDate(iso: string) {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return monthFmt.format(new Date(iso));
}

// --- inline SVG area chart ---
const CHART_W = 1000;
const CHART_H = 200;
const GRID_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];

const chart = computed(() => {
  const visits = data.value?.visits ?? [];
  const n = visits.length;
  const maxRaw = n ? Math.max(...visits.map((v) => v.count)) : 1;
  const power = Math.pow(10, Math.floor(Math.log10(Math.max(1, maxRaw))));
  const yMax = Math.max(1, Math.ceil(maxRaw / power) * power);
  const points = visits.map((v, i) => ({
    date: v.date,
    count: v.count,
    x: n === 1 ? CHART_W / 2 : (i / (n - 1)) * CHART_W,
    y: CHART_H - (v.count / yMax) * CHART_H,
  }));
  const line = points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = n
    ? `${line} L${points[n - 1].x.toFixed(1)},${CHART_H} L${points[0].x.toFixed(1)},${CHART_H} Z`
    : "";
  const total = visits.reduce((sum, v) => sum + v.count, 0);
  return { visits, points, line, area, yMax, total };
});

const hoverIndex = ref<number | null>(null);
const chartEl = ref<HTMLElement | null>(null);
const hoverPoint = computed(() =>
  hoverIndex.value === null ? null : (chart.value.points[hoverIndex.value] ?? null),
);

function hoverLeft(point: { x: number; y: number }, vertical: boolean) {
  const pct = vertical ? (point.y / CHART_H) * 100 : Math.min(94, Math.max(6, (point.x / CHART_W) * 100));
  return `${pct}%`;
}

function onChartMove(e: MouseEvent) {
  const points = chart.value.points;
  if (!points.length || !chartEl.value) return;
  const rect = chartEl.value.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  hoverIndex.value = Math.round(ratio * (points.length - 1));
}

definePageMeta({ layout: "jasladmin-dashboard" });
</script>

<template>
  <div>
    <!-- loading -->
    <div v-if="isLoading" class="animate-pulse py-24 text-center font-mono text-sm text-dim">
      // loading dashboard…
    </div>

    <!-- error -->
    <div v-else-if="loadError" class="border border-amber/40 bg-amber/5 p-6">
      <p class="font-mono text-sm uppercase tracking-wider text-amber">// signal lost</p>
      <p class="mt-1 text-xs text-dim">Failed to load dashboard stats</p>
      <UiButton variant="outline" size="sm" class="mt-4" @click="fetchData">retry</UiButton>
    </div>

    <div v-else-if="data" class="space-y-6">
      <!-- header -->
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-xl font-medium text-bright">
            <span class="font-mono text-phosphor">// </span><span class="font-mono">overview</span>
          </h1>
          <p class="mt-1 text-sm text-dim">System Performance &amp; Portfolio Stats</p>
        </div>
        <UiButton variant="outline" size="sm" href="/" target="_blank">
          <Icon name="fa-solid:external-link-alt" size="12" />
          visit portfolio
        </UiButton>
      </div>

      <!-- stat tiles — same 4-track grid + gap as the cards below so columns align -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <div class="border border-line bg-panel/60 px-4 py-3">
          <div class="flex items-center justify-between gap-3">
            <p class="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              <Icon name="fa:folder" size="12" class="text-phosphor/50" />
              total projects
            </p>
            <p class="font-mono text-2xl leading-none text-phosphor">{{ data.counts.projects }}</p>
          </div>
          <p class="mt-1.5 font-mono text-[10px] text-dim">published</p>
        </div>

        <div class="border border-line bg-panel/60 px-4 py-3">
          <div class="flex items-center justify-between gap-3">
            <p class="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              <Icon name="fa:road" size="12" class="text-amber/50" />
              roadmap items
            </p>
            <p class="font-mono text-2xl leading-none text-phosphor">{{ data.counts.roadmap }}</p>
          </div>
          <p class="mt-1.5 font-mono text-[10px] text-dim">queued</p>
        </div>

        <div class="border border-line bg-panel/60 px-4 py-3">
          <div class="flex items-center justify-between gap-3">
            <p class="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              <Icon name="fa:download" size="12" class="text-phosphor/50" />
              resume downloads
            </p>
            <p class="font-mono text-2xl leading-none text-phosphor">{{ data.counts.resumeDownloads }}</p>
          </div>
          <p class="mt-1.5 font-mono text-[10px] text-dim">all time</p>
        </div>

        <!-- work status — clickable toggle -->
        <button
          class="relative overflow-hidden border border-line bg-panel/60 px-4 py-3 text-left transition-colors hover:border-phosphor/40 disabled:cursor-wait"
          :disabled="togglingStatus"
          @click="toggleStatus"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              <Icon
                name="fa-solid:network-wired"
                size="12"
                :class="data.status.isOpenToWork ? 'text-phosphor/60' : 'text-dim'"
              />
              work status
            </p>
            <p
              class="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider"
              :class="data.status.isOpenToWork ? 'text-phosphor' : 'text-dim'"
            >
              <span
                class="inline-block h-2 w-2 rounded-full"
                :class="data.status.isOpenToWork ? 'animate-pulse bg-phosphor' : 'bg-dim'"
              />
              {{ data.status.isOpenToWork ? 'available' : 'unavailable' }}
            </p>
          </div>
          <p class="mt-1.5 font-mono text-[10px] text-dim">click to toggle</p>
          <div
            v-if="data.status.isOpenToWork"
            class="pointer-events-none absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-phosphor opacity-10 blur-2xl"
          />
        </button>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <!-- left column: traffic + locations -->
        <div class="min-w-0 space-y-6 lg:col-span-3">
          <!-- traffic overview -->
          <UiCard class="p-6">
            <div class="mb-4 flex items-center justify-between gap-4">
              <h3 class="flex items-center gap-3 font-mono text-sm uppercase tracking-wider text-bright">
                <span class="h-4 w-1 bg-phosphor shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                traffic overview
              </h3>
              <p class="font-mono text-[10px] uppercase tracking-wider text-dim">
                {{ chart.total }} visits · 30d window
              </p>
            </div>

            <div v-if="chart.points.length">
              <div
                ref="chartEl"
                class="relative h-[190px] w-full cursor-crosshair"
                @mousemove="onChartMove"
                @mouseleave="hoverIndex = null"
              >
                <svg
                  :viewBox="`0 0 ${CHART_W} ${CHART_H}`"
                  preserveAspectRatio="none"
                  class="absolute inset-0 h-full w-full"
                >
                  <defs>
                    <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stop-color="#4ADE80" stop-opacity="0.25" />
                      <stop offset="95%" stop-color="#4ADE80" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                  <line
                    v-for="f in GRID_FRACTIONS"
                    :key="f"
                    x1="0"
                    :y1="CHART_H * (1 - f)"
                    :x2="CHART_W"
                    :y2="CHART_H * (1 - f)"
                    stroke="#232326"
                    stroke-dasharray="4 4"
                    vector-effect="non-scaling-stroke"
                  />
                  <path :d="chart.area" fill="url(#trafficFill)" />
                  <path
                    :d="chart.line"
                    fill="none"
                    stroke="#4ADE80"
                    stroke-width="2"
                    vector-effect="non-scaling-stroke"
                  />
                </svg>

                <span class="absolute left-1 top-0 font-mono text-[10px] text-dim">{{ chart.yMax }}</span>
                <span class="absolute bottom-0 left-1 font-mono text-[10px] text-dim">0</span>

                <template v-if="hoverPoint">
                  <div
                    class="absolute top-0 h-full w-px bg-line"
                    :style="{ left: `${(hoverPoint.x / CHART_W) * 100}%` }"
                  />
                  <div
                    class="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-abyss bg-phosphor shadow-[0_0_8px_rgba(74,222,128,0.7)]"
                    :style="{ left: `${(hoverPoint.x / CHART_W) * 100}%`, top: `${(hoverPoint.y / CHART_H) * 100}%` }"
                  />
                  <div
                    class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[135%] whitespace-nowrap border border-line bg-panel px-2 py-1 font-mono text-[10px] text-bright"
                    :style="{ left: hoverLeft(hoverPoint, false), top: `${(hoverPoint.y / CHART_H) * 100}%` }"
                  >
                    {{ fmtDate(hoverPoint.date) }} · {{ hoverPoint.count }} visits
                  </div>
                </template>
              </div>

              <div class="mt-2 flex justify-between font-mono text-[10px] text-dim">
                <span>{{ fmtDate(chart.visits[0].date) }}</span>
                <span v-if="chart.visits.length > 2">
                  {{ fmtDate(chart.visits[Math.floor((chart.visits.length - 1) / 2)].date) }}
                </span>
                <span>{{ fmtDate(chart.visits[chart.visits.length - 1].date) }}</span>
              </div>
            </div>
            <p v-else class="py-16 text-center font-mono text-xs italic text-dim">no traffic recorded</p>
          </UiCard>

          <VisitorLocationTracker :location-stats="data.locationStats" />
        </div>

        <!-- right column: comments — pinned to the left column's height at lg,
             so a long comment list scrolls inside instead of stretching the page -->
        <div class="relative flex min-w-0 flex-col gap-6 lg:col-span-1">
          <!-- comments scroller -->
          <UiCard class="flex h-[482px] flex-col overflow-hidden lg:absolute lg:inset-0 lg:h-auto">
            <div class="flex items-center gap-2 border-b border-line p-3">
              <span class="h-2 w-2 animate-pulse rounded-full bg-phosphor" />
              <span class="font-mono text-xs font-semibold uppercase tracking-wider text-bright">
                project comments
              </span>
              <span class="ml-auto border border-line px-1.5 font-mono text-[10px] text-dim">
                {{ data.comments.length }}
              </span>
            </div>

            <div class="flex-1 overflow-y-auto">
              <div v-if="data.comments.length">
                <div
                  v-for="comment in data.comments"
                  :key="comment.id"
                  class="border-t border-line p-4 transition-colors first:border-t-0 hover:bg-panel/70"
                  :class="!comment.isRead && 'bg-phosphor/[0.03]'"
                >
                  <div class="mb-1 flex items-start justify-between gap-2">
                    <span class="flex items-center gap-2 text-xs font-bold text-bright">
                      {{ comment.name || 'Anonymous' }}
                      <span v-if="!comment.isRead" class="h-1.5 w-1.5 shrink-0 rounded-full bg-phosphor" />
                    </span>
                    <span class="shrink-0 font-mono text-[10px] text-dim">{{ relDate(comment.createdAt) }}</span>
                  </div>

                  <div v-if="comment.email" class="mb-2 truncate font-mono text-[10px] text-dim">
                    {{ comment.email }}
                  </div>

                  <p class="whitespace-pre-wrap break-words text-xs leading-relaxed text-secondary">
                    {{ comment.content }}
                  </p>
                </div>
              </div>
              <div v-else class="flex h-full flex-col items-center justify-center p-6 text-center">
                <p class="font-mono text-sm text-dim">no messages yet</p>
                <p class="mt-1 font-mono text-xs text-dim/60">new comments will appear here</p>
              </div>
            </div>
          </UiCard>
        </div>
      </div>
    </div>
  </div>
</template>
