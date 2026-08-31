<script setup lang="ts">
import { marked } from "marked";

type FeaturedBeat = { label: string; text: string };

type FeaturedSystem = {
  id: string;
  kicker: string;
  status: string;
  name: string;
  sub?: string;
  subLink?: { label: string; href: string } | null;
  logo?: { src: string; alt: string } | null;
  actions: { label: string; href: string; kind: "live" | "doc"; external?: boolean }[];
  beats?: FeaturedBeat[];
};

type FeatureStripData = {
  id: string;
  kicker: string;
  title: string;
  description: string;
  tags: string[];
  repoUrl?: string | null;
  demoUrl?: string | null;
  logo?: string;
  stats?: { value: string; label: string }[];
};

const props = defineProps<{
  feature: FeaturedSystem;
  content?: string | null;
  strip?: FeatureStripData;
}>();

const readmeHtml = computed(() => marked.parse(props.content || "", { async: false }) as string);
const docHref = computed(() => props.feature.actions.find((a) => a.kind === "doc")?.href ?? `/projects/${props.feature.id}`);
</script>

<template>
  <section class="border-b border-line py-14">
    <div class="mb-[30px] flex items-baseline justify-between" data-reveal>
      <h2 class="text-[1.3rem] font-medium text-bright">
        <span class="font-mono text-phosphor">// </span>
        featured projects
      </h2>
    </div>

    <div
      data-reveal
      class="brackets relative border border-phosphor/40 bg-[radial-gradient(ellipse_70%_60%_at_24%_0%,rgba(74,222,128,0.07),transparent_62%),rgba(20,20,22,0.5)] shadow-[0_0_60px_rgba(74,222,128,0.05)]"
    >
      <div class="flex items-center justify-between border-b border-phosphor/25 px-[22px] py-[11px] font-mono text-[11px] uppercase tracking-[0.18em] text-dim">
        <span class="pulse-soft text-phosphor">★ {{ props.feature.kicker }}</span>
        <span class="text-phosphor">{{ props.feature.status }}</span>
      </div>

      <div class="grid grid-cols-[1fr_auto] items-end gap-[30px] px-[34px] pt-10 max-md:grid-cols-1 max-md:items-start max-md:px-[22px]">
        <div v-if="props.feature.logo?.src">
          <div class="relative h-[92px] w-[300px] max-w-full">
            <img
              :src="props.feature.logo.src"
              :alt="props.feature.logo.alt"
              class="absolute inset-0 h-full w-full object-contain object-left drop-shadow-[0_0_30px_rgba(74,222,128,0.2)]"
            />
          </div>
          <p v-if="props.feature.sub" class="mt-3 font-mono text-[12.5px] text-dim">
            {{ props.feature.sub }}
            <a
              v-if="props.feature.subLink"
              :href="props.feature.subLink.href"
              target="_blank"
              rel="noopener noreferrer"
              class="text-phosphor transition-colors hover:text-bright"
            >
              {{ props.feature.subLink.label }}
            </a>
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <template v-for="action in props.feature.actions" :key="action.label">
            <a
              v-if="action.external"
              :href="action.href"
              target="_blank"
              rel="noopener noreferrer"
              class="px-5 py-[11px] font-mono text-[13px] transition-colors"
              :class="action.kind === 'live' ? 'border border-phosphor text-phosphor hover:bg-phosphor/10' : 'border border-amber/55 text-amber hover:bg-amber/10'"
            >
              {{ action.label }}
            </a>
            <NuxtLink
              v-else
              :to="action.href"
              class="px-5 py-[11px] font-mono text-[13px] transition-colors"
              :class="action.kind === 'live' ? 'border border-phosphor text-phosphor hover:bg-phosphor/10' : 'border border-amber/55 text-amber hover:bg-amber/10'"
            >
              {{ action.label }}
            </NuxtLink>
          </template>
        </div>
      </div>

      <div v-if="props.feature.beats?.length" class="grid grid-cols-3 gap-[30px] px-[34px] pb-1 pt-8 max-md:grid-cols-1 max-md:px-[22px]">
        <div v-for="beat in props.feature.beats" :key="beat.label" class="border-t border-line pt-[14px]">
          <div class="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-phosphor">{{ beat.label }}</div>
          <p class="text-[0.95rem] leading-[1.55] text-text-secondary">{{ beat.text }}</p>
        </div>
      </div>

      <div v-if="props.content" class="mx-[34px] mb-[34px] mt-8 border border-line bg-[#0D0D0F] max-md:mx-[22px]">
        <div class="flex justify-between border-b border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
          <span>
            {{ props.feature.id }}/<span class="text-phosphor">README.md</span>
          </span>
          <span>markdown · rendered</span>
        </div>
        <div class="relative max-h-[280px] overflow-hidden px-7 pt-6">
          <!-- eslint-disable-next-line vue/no-v-html — own CMS content -->
          <div
            class="prose-nightops"
            v-html="readmeHtml"
          />
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] bg-gradient-to-b from-transparent to-[#0D0D0F]" />
          <div class="absolute inset-x-0 bottom-4 z-[2] flex justify-center">
            <NuxtLink
              :to="docHref"
              class="inline-block border border-amber/55 bg-[#0D0D0F]/60 px-5 py-[11px] font-mono text-[13px] text-amber transition-colors hover:bg-amber/10"
            >
              read more →
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="props.strip"
      data-reveal
      class="mt-[18px] grid grid-cols-[auto_1fr_auto_auto] items-center gap-9 border border-phosphor/40 bg-panel/50 px-[30px] py-[28px] max-md:grid-cols-1 max-md:gap-6"
    >
      <div v-if="props.strip.logo" class="relative h-[132px] w-[132px] shrink-0 overflow-hidden border border-line">
        <img :src="props.strip.logo" :alt="`${props.strip.title} logo`" class="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div class="min-w-0">
        <div class="font-mono text-[11px] uppercase tracking-[0.18em] text-dim">{{ props.strip.kicker }}</div>
        <h3 class="mt-1 text-[1.5rem] font-semibold text-bright">{{ props.strip.title }}</h3>
        <p class="mt-1.5 font-mono text-[0.88rem] leading-[1.55] text-dim">{{ props.strip.description }}</p>
        <p class="mt-2.5 font-mono text-[11px] tracking-[0.04em] text-dim opacity-75">
          {{ props.strip.tags.join(" · ") }}
        </p>
      </div>
      <div v-if="props.strip.stats && props.strip.stats.length > 0" class="flex shrink-0 gap-9">
        <div v-for="stat in props.strip.stats" :key="stat.label">
          <div class="font-mono text-[1.35rem] font-bold text-phosphor">{{ stat.value }}</div>
          <div class="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">{{ stat.label }}</div>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-4">
        <a
          v-if="props.strip.demoUrl"
          :href="props.strip.demoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="font-mono text-[12px] text-dim transition-colors hover:text-bright"
        >
          live ↗
        </a>
        <a
          v-if="props.strip.repoUrl"
          :href="props.strip.repoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="font-mono text-[12px] text-dim transition-colors hover:text-bright"
        >
          code ↗
        </a>
        <NuxtLink
          :to="`/projects/${props.strip.id}`"
          class="whitespace-nowrap border border-phosphor px-3.5 py-1.5 font-mono text-[12px] text-phosphor transition-colors hover:bg-phosphor/10"
        >
          inspect →
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
