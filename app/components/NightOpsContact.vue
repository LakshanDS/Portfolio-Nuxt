<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    profile: { email?: string; githubUrl?: string; linkedinUrl?: string; whatsappUrl?: string } | null;
    available?: boolean;
    headline?: string;
    accent?: string;
    sub?: string;
    metaLine?: string;
    ctaLabel?: string;
  }>(),
  {
    available: false,
    headline: "Hire the",
    accent: "engineer",
    sub: "You've seen the work, the tools, and the record. If you need someone who writes fast code and owns the pipeline it ships on — the next step is one email away.",
    metaLine: "avg response < 24h · sri lanka · utc+5:30",
    ctaLabel: "$ hire --now",
  },
);
</script>

<template>
  <section id="contact" class="relative overflow-hidden pb-[72px] pt-[84px] text-center">
    <div aria-hidden class="ops-grid-bottom" />
    <div class="relative" data-reveal>
      <div
        class="inline-flex items-center justify-center gap-[9px] font-mono text-[11px] uppercase leading-none tracking-[0.18em]"
        :class="props.available ? 'text-phosphor' : 'text-dim'"
      >
        <span
          class="relative -top-[0.5px] inline-block h-[7px] w-[7px] animate-pulse rounded-full"
          :class="props.available ? 'bg-phosphor shadow-[0_0_10px_rgba(74,222,128,0.8)]' : 'bg-dim'"
        />
        {{ props.available ? "available for hire" : "currently off-duty" }}
      </div>

      <div
        aria-hidden
        class="draw-line mx-auto mt-2 h-px w-[320px] max-w-full bg-gradient-to-r from-transparent via-phosphor/60 to-transparent"
      />

      <h2 class="mt-4 font-mono text-[clamp(2rem,5.6vw,4rem)] font-bold uppercase leading-[1.06] tracking-[-0.02em] text-bright">
        {{ props.headline }}
        <span class="text-phosphor">{{ props.accent }}</span>.
      </h2>

      <p class="mx-auto mt-4 max-w-[54ch] text-dim">{{ props.sub }}</p>

      <div class="mt-[30px] flex flex-wrap justify-center gap-3.5">
        <a
          v-if="props.profile?.email"
          :href="`mailto:${props.profile.email}`"
          class="border border-phosphor px-[22px] py-3 font-mono text-[13.5px] text-phosphor transition-colors hover:bg-phosphor/10"
        >
          {{ props.ctaLabel }}
        </a>
        <a
          v-if="props.profile?.githubUrl"
          :href="props.profile.githubUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="border border-amber/55 px-[22px] py-3 font-mono text-[13.5px] text-amber transition-colors hover:bg-amber/10"
        >
          github ↗
        </a>
        <a
          v-if="props.profile?.linkedinUrl"
          :href="props.profile.linkedinUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="border border-amber/55 px-[22px] py-3 font-mono text-[13.5px] text-amber transition-colors hover:bg-amber/10"
        >
          linkedin ↗
        </a>
        <a
          v-if="props.profile?.whatsappUrl"
          :href="props.profile.whatsappUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="border border-amber/55 px-[22px] py-3 font-mono text-[13.5px] text-amber transition-colors hover:bg-amber/10"
        >
          whatsapp ↗
        </a>
      </div>

      <div class="mt-[18px] font-mono text-[11.5px] text-dim">{{ props.metaLine }}</div>
    </div>
  </section>
</template>
