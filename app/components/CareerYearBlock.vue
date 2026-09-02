<script setup lang="ts">
type YearItem = {
  id: string;
  title: string;
  category?: string;
  description: string;
  status: string;
};

// presentational — expansion state (visibleCount) lives in the section
const props = defineProps<{
  year: string;
  items: YearItem[];
  isCurrentYear: boolean;
  isFirst: boolean;
  collapsed: number; // entries shown at rest
  visibleCount: number;
  showButtons?: boolean; // false on the last year — the section --more button replaces these
}>();

defineEmits<{ more: []; less: [] }>();

const BATCH = 3; // entries revealed per "view more" click
const base = computed(() => props.items.slice(0, props.collapsed));
const extras = computed(() => props.items.slice(props.collapsed, props.visibleCount));
const remaining = computed(() => Math.max(0, props.items.length - props.visibleCount));
const canExpandMore = computed(() => props.visibleCount < props.collapsed + BATCH);

function statusFor(status: string) {
  const s = status.toLowerCase();
  if (s === "completed") return { chip: "shipped", mark: "✓", markCls: "text-phosphor", chipCls: "border-phosphor/50 text-phosphor", rowCls: "" };
  if (s === "in-progress") return { chip: "building", mark: "◆", markCls: "text-amber", chipCls: "border-amber/50 text-amber", rowCls: "" };
  return { chip: "queued", mark: "▸", markCls: "text-dim", chipCls: "border-line text-dim", rowCls: "opacity-60" };
}
</script>

<template>
  <div class="px-[18px] pt-4" :class="props.isFirst ? '' : 'border-t border-dashed border-line'">
    <div class="mb-1 flex items-center gap-3">
      <span class="border border-phosphor/45 px-2.5 py-0.5 font-mono text-[12.5px] font-bold text-phosphor">
        v{{ props.year }}
      </span>
      <span class="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
        {{ props.isCurrentYear ? "in development" : "released" }}
      </span>
      <span
        v-if="props.isCurrentYear"
        class="ml-auto animate-pulse font-mono text-[10px] uppercase tracking-[0.16em] text-amber"
      >
        ● current
      </span>
    </div>

    <ul>
      <li
        v-for="item in base"
        :key="item.id"
        class="flex items-baseline gap-3 py-[7px] pl-1 font-mono text-[13px]"
        :class="statusFor(item.status).rowCls"
      >
        <span class="flex-shrink-0" :class="statusFor(item.status).markCls">{{ statusFor(item.status).mark }}</span>
        <span class="text-text-secondary">
          {{ item.title.toLowerCase() }}
          <small class="mt-0.5 block text-[11.5px] text-dim">
            {{ (item.category ?? item.description).toLowerCase() }}
          </small>
        </span>
        <span
          class="ml-auto flex-shrink-0 border px-2 py-0.5 font-mono text-[10.5px]"
          :class="statusFor(item.status).chipCls"
        >
          {{ statusFor(item.status).chip }}
        </span>
      </li>
    </ul>

    <div class="career-collapse" :style="{ gridTemplateRows: extras.length ? '1fr' : '0fr' }">
      <div
        class="career-collapse-inner"
        :style="
          remaining > 0 && canExpandMore
            ? {
                WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
              }
            : undefined
        "
      >
        <ul>
          <li
            v-for="item in extras"
            :key="item.id"
            class="flex items-baseline gap-3 py-[7px] pl-1 font-mono text-[13px]"
            :class="statusFor(item.status).rowCls"
          >
            <span class="flex-shrink-0" :class="statusFor(item.status).markCls">{{ statusFor(item.status).mark }}</span>
            <span class="text-text-secondary">
              {{ item.title.toLowerCase() }}
              <small class="mt-0.5 block text-[11.5px] text-dim">
                {{ (item.category ?? item.description).toLowerCase() }}
              </small>
            </span>
            <span
              class="ml-auto flex-shrink-0 border px-2 py-0.5 font-mono text-[10.5px]"
              :class="statusFor(item.status).chipCls"
            >
              {{ statusFor(item.status).chip }}
            </span>
          </li>
        </ul>
      </div>
    </div>

    <button
      v-if="props.showButtons && remaining > 0 && canExpandMore"
      type="button"
      class="mb-3 mt-1 block w-full border border-dashed border-line py-1.5 text-center font-mono text-[11.5px] text-dim transition-colors hover:border-phosphor/50 hover:text-phosphor"
      @click="$emit('more')"
    >
      view {{ Math.min(BATCH, remaining) }} more →
    </button>
    <button
      v-if="props.showButtons && props.visibleCount > props.collapsed"
      type="button"
      class="mb-3 mt-1 block w-full border border-dashed border-line py-1.5 text-center font-mono text-[11.5px] text-dim transition-colors hover:border-phosphor/50 hover:text-phosphor"
      @click="$emit('less')"
    >
      show less ↑
    </button>
  </div>
</template>
