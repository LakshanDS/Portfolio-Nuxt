<script setup lang="ts">
import { renderMermaidSvg } from "~/utils/mermaid";

const props = defineProps<{ chart: string }>();

const svg = ref("");
const error = ref<string | null>(null);
let rendering = false;

async function renderChart() {
  if (rendering) return;
  rendering = true;
  try {
    if (props.chart) {
      svg.value = await renderMermaidSvg(props.chart);
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
  () => renderChart(),
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
    class="mermaid-box overflow-x-auto"
    v-html="svg"
  />
</template>
