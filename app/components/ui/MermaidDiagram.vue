<script setup lang="ts">
import type Mermaid from "mermaid";

// mermaid is a ~5 MB browser-only library — importing it statically drags
// it into the worker bundle (over Cloudflare's size limit), so it is
// loaded lazily on the client only.
const svgCache = new Map<string, string>();
let mermaidPromise: Promise<typeof Mermaid> | null = null;

async function loadMermaid(): Promise<typeof Mermaid> {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((mod) => {
      mod.default.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          primaryColor: "#4ADE80",
          primaryTextColor: "#f5f5f0",
          primaryBorderColor: "#232326",
          lineColor: "#4ADE80",
          secondaryColor: "#141416",
          tertiaryColor: "#141416",
          background: "#141416",
          mainBkg: "#141416",
          secondBkg: "#141416",
          textColor: "#f5f5f0",
          nodeBorder: "#4ADE80",
          clusterBkg: "#141416",
          clusterBorder: "#232326",
          titleColor: "#f5f5f0",
          edgeLabelBackground: "#141416",
        },
        flowchart: {
          htmlLabels: true,
          curve: "basis",
        },
      });
      return mod.default;
    });
  }
  return mermaidPromise;
}

const props = defineProps<{ chart: string }>();

const svg = ref(svgCache.get(props.chart) || "");
const error = ref<string | null>(null);
let rendering = false;

// Generate a stable ID based on chart content
const chartId = computed(() => {
  let hash = 0;
  for (let i = 0; i < props.chart.length; i++) {
    const char = props.chart.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `mermaid-${Math.abs(hash)}`;
});

async function renderChart() {
  // If already cached, use the cached version
  if (svgCache.has(props.chart)) {
    svg.value = svgCache.get(props.chart)!;
    return;
  }

  // Prevent concurrent renders
  if (rendering) return;
  rendering = true;

  try {
    if (props.chart) {
      const mermaid = await loadMermaid();
      const { svg: renderedSvg } = await mermaid.render(chartId.value, props.chart);
      svgCache.set(props.chart, renderedSvg);
      svg.value = renderedSvg;
      error.value = null;
    }
  } catch {
    error.value = "Failed to render diagram";
  } finally {
    rendering = false;
  }
}

onMounted(renderChart);
watch(
  () => props.chart,
  () => {
    svg.value = svgCache.get(props.chart) || "";
    renderChart();
  },
);
</script>

<template>
  <!-- class falls through to whichever branch is root -->
  <div
    v-if="error"
    class="mb-6 rounded-lg border border-red-500/50 bg-[#141416] p-4 font-mono text-sm text-red-400"
  >
    <p class="mb-2">⚠️ Mermaid Diagram Error</p>
    <pre class="overflow-x-auto text-xs text-[#d4d4ce]">{{ props.chart }}</pre>
  </div>

  <div
    v-else-if="!svg"
    class="flex min-h-[100px] items-center justify-center rounded-lg border border-[#232326] bg-[#141416] p-6"
  >
    <div class="animate-pulse font-mono text-sm text-[#4ADE80]">Loading diagram...</div>
  </div>

  <!-- eslint-disable-next-line vue/no-v-html — svg is generated locally by mermaid -->
  <div
    v-else
    class="mb-6 flex justify-center overflow-x-auto rounded-lg border border-[#232326] bg-[#141416] p-6 shadow-inner"
    v-html="svg"
  />
</template>
