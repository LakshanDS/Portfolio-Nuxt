<script setup lang="ts">
type YearItem = {
  id: string;
  title: string;
  category?: string;
  description: string;
  status: string;
};

const props = defineProps<{
  year: string;
  items: YearItem[];
  // section-level overflow (homepage --more) — animates open/closed via career-collapse
  overflowItems?: YearItem[];
  isCurrentYear: boolean;
  isFirst: boolean;
}>();

const CAP = 3; // entries visible when collapsed
const BATCH = 2; // entries revealed per "view more" click
const MAX = 5; // never more than this visible at once
const SCROLL_COLLAPSE_PX = 400; // scroll distance from expand point before auto-collapse

const visible = ref(CAP);
const base = computed(() => props.items.slice(0, CAP));
const extras = computed(() => props.items.slice(CAP, visible.value));
const remaining = computed(() => props.items.length - visible.value);

function statusFor(status: string) {
  const s = status.toLowerCase();
  if (s === "completed") return { chip: "shipped", mark: "✓", markCls: "text-phosphor", chipCls: "border-phosphor/50 text-phosphor", rowCls: "" };
  if (s === "in-progress") return { chip: "building", mark: "◆", markCls: "text-amber", chipCls: "border-amber/50 text-amber", rowCls: "" };
  return { chip: "queued", mark: "▸", markCls: "text-dim", chipCls: "border-line text-dim", rowCls: "opacity-60" };
}

// collapse expanded extras once the user scrolls away from where they opened
let anchor = 0;
function onScroll() {
  if (Math.abs(window.scrollY - anchor) > SCROLL_COLLAPSE_PX) visible.value = CAP;
}
watch(visible, (value) => {
  if (value > CAP) {
    anchor = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
  } else {
    window.removeEventListener("scroll", onScroll);
  }
});
onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));

function viewMore() {
  visible.value = Math.min(visible.value + BATCH, MAX);
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
          remaining > 0 && visible < MAX
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

    <div class="career-collapse" :style="{ gridTemplateRows: overflowItems?.length ? '1fr' : '0fr' }">
      <div>
        <ul>
          <li
            v-for="item in overflowItems ?? []"
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
      v-if="remaining > 0 && visible < MAX"
      type="button"
      class="mb-3 mt-1 block w-full border border-dashed border-line py-1.5 text-center font-mono text-[11.5px] text-dim transition-colors hover:border-phosphor/50 hover:text-phosphor"
      @click="viewMore"
    >
      view {{ Math.min(BATCH, remaining) }} more →
    </button>
    <button
      v-if="visible > CAP"
      type="button"
      class="mb-3 mt-1 block w-full border border-dashed border-line py-1.5 text-center font-mono text-[11.5px] text-dim transition-colors hover:border-phosphor/50 hover:text-phosphor"
      @click="visible = CAP"
    >
      show less ↑
    </button>
  </div>
</template>
