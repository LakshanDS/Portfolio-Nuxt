<script setup lang="ts">
type ToolItem = {
  id: string;
  name: string;
  icon?: string | null;
  iconColor?: string | null;
};

const props = defineProps<{ tools: ToolItem[] }>();

const copies = [0, 1];
</script>

<template>
  <section v-if="props.tools.length > 0" class="border-b border-line py-7" aria-label="tools of the trade">
    <div class="relative overflow-hidden" data-reveal>
      <div class="animate-marquee flex w-max items-center hover:[animation-play-state:paused]">
        <div
          v-for="copy in copies"
          :key="copy"
          class="flex shrink-0 items-center"
          :aria-hidden="copy === 1 || undefined"
        >
          <div
            v-for="tool in props.tools"
            :key="`${copy}-${tool.id}`"
            class="group mx-[24px] flex items-center gap-2.5 opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
          >
            <span
              class="flex text-dim transition-colors group-hover:text-[var(--tool-color)]"
              :style="{ '--tool-color': tool.iconColor || 'var(--color-phosphor)' }"
            >
              <Icon :name="toIconName(tool.icon)" class="h-[19px] w-[19px]" />
            </span>
            <span class="font-mono text-[13px] text-text-secondary">{{ tool.name }}</span>
          </div>
        </div>
      </div>
      <div class="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-abyss to-transparent" />
      <div class="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-abyss to-transparent" />
    </div>
  </section>
</template>
