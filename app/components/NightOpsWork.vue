<script setup lang="ts">
type WorkProject = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: string;
  imageUrl?: string | null;
  demoUrl?: string | null;
  repoUrl?: string | null;
};

import { statusFor, initialsFor } from "~/utils/projects";

const props = withDefaults(
  defineProps<{
    projects: WorkProject[];
    headerless?: boolean;
    numbers?: Record<string, string>;
  }>(),
  { headerless: false, numbers: undefined },
);
</script>

<template>
  <section id="work" class="border-b border-line py-16">
    <div v-if="!props.headerless" class="mb-[30px] flex items-baseline justify-between" data-reveal>
      <h2 class="text-[1.3rem] font-medium text-bright">
        <span class="font-mono text-phosphor">// </span>
        systems i&rsquo;ve built --short
      </h2>
      <NuxtLink to="/projects" class="font-mono text-[12.5px] text-dim transition-colors hover:text-phosphor">
        --all →
      </NuxtLink>
    </div>

    <div class="grid grid-cols-3 gap-[18px] max-md:grid-cols-1">
      <div
        v-for="(project, index) in props.projects"
        :key="project.id"
        data-reveal
        :style="{ '--reveal-delay': `${(index % 3) * 90}ms` }"
      >
        <div
          class="relative flex h-full flex-col border border-line bg-panel/55 p-[14px] transition-[border-color,transform] duration-200 hover:-translate-y-[3px] hover:border-phosphor/55"
        >
          <NuxtLink :to="`/projects/${project.id}`" :aria-label="project.title" class="absolute inset-0 z-0" />

          <div class="flex items-center justify-between px-1 pb-3 pt-0.5">
            <span class="font-mono text-[11px] text-dim">
              {{ props.numbers?.[project.id] ?? String(index + 1).padStart(2, "0") }}
            </span>
            <span
              class="flex items-center gap-[7px] font-mono text-[11px]"
              :class="statusFor(project.status).dimmed ? 'text-dim' : statusFor(project.status).wip ? 'text-amber' : 'text-phosphor'"
            >
              <i
                class="h-1.5 w-1.5 rounded-full"
                :class="statusFor(project.status).dimmed ? 'bg-dim' : statusFor(project.status).wip ? 'animate-pulse bg-amber' : 'bg-phosphor'"
              />
              {{ statusFor(project.status).label }}
            </span>
          </div>

          <div class="brackets relative aspect-[4/3] overflow-hidden border border-line bg-[#0D0D0F]">
            <img
              v-if="project.imageUrl"
              :src="project.imageUrl"
              :alt="project.title"
              loading="lazy"
              class="absolute inset-0 h-full w-full object-cover"
            />
            <div
              v-else
              class="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_90%_70%_at_50%_20%,rgba(74,222,128,0.08),transparent_60%)] font-mono text-[2.6rem] font-bold text-phosphor/45"
            >
              {{ initialsFor(project.title) }}
            </div>
            <div class="absolute inset-0 bg-gradient-to-b from-phosphor/5 via-transparent to-[#0A0A0B]/50" />
          </div>

          <div class="flex flex-1 flex-col gap-2.5 px-1.5 pb-1 pt-4">
            <h3 class="truncate text-[1.08rem] font-medium text-bright">{{ project.title }}</h3>
            <p class="line-clamp-2 font-mono text-[0.85rem] leading-[1.55] text-dim">{{ project.description }}</p>
            <div class="flex gap-1.5 overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,black_82%,transparent)]">
              <span
                v-for="tag in project.tags.slice(0, 8)"
                :key="tag"
                class="shrink-0 border border-line px-2 py-[3px] font-mono text-[10.5px] uppercase tracking-[0.06em] text-dim"
              >
                {{ tag }}
              </span>
            </div>
            <div class="relative z-10 mt-auto flex items-center gap-2 pt-3">
              <a
                v-if="project.repoUrl"
                :href="project.repoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 whitespace-nowrap border border-line px-2 py-[7px] text-center font-mono text-[12px] text-dim transition-colors hover:border-dim hover:text-bright"
              >
                code ↗
              </a>
              <a
                v-if="project.demoUrl"
                :href="project.demoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 whitespace-nowrap border border-line px-2 py-[7px] text-center font-mono text-[12px] text-dim transition-colors hover:border-dim hover:text-bright"
              >
                live ↗
              </a>
              <NuxtLink
                :to="`/projects/${project.id}`"
                class="flex-1 whitespace-nowrap border border-phosphor px-2 py-[7px] text-center font-mono text-[12px] text-phosphor transition-colors hover:bg-phosphor/10"
              >
                inspect →
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
