<script setup lang="ts">
type HeroSettings = {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  imageUrl?: string;
};

const props = defineProps<{
  settings: HeroSettings;
  isOpenToWork: boolean;
  operatorName: string;
}>();

// Title markup: the name in "Hi, I'm <name>." renders phosphor; segments
// wrapped in \\...\\ render dim; a literal \n forces a line break.
// e.g. `Hi, I'm Lakshan.\n\\I build software for people.\\`
interface TitleSegment {
  dim: boolean;
  br: boolean;
  before: string;
  name: string;
  after: string;
}

function pushSegment(out: TitleSegment[], text: string, dim: boolean) {
  if (!text) return;
  if (dim) {
    out.push({ dim: true, br: false, before: text, name: "", after: "" });
    return;
  }
  const m = text.match(/Hi, I'm?\s+([A-Za-z]+)/i);
  const name = m?.[1];
  if (!m || m.index === undefined || !name) {
    out.push({ dim: false, br: false, before: text, name: "", after: "" });
    return;
  }
  const at = text.indexOf(name, m.index);
  out.push({ dim: false, br: false, before: text.slice(0, at), name, after: text.slice(at + name.length) });
}

const titleSegments = computed<TitleSegment[]>(() => {
  const raw = props.settings.title || "";
  const out: TitleSegment[] = [];
  // lines split on a literal \n in the stored setting
  raw.split("\\n").forEach((line, li) => {
    const first = out.length;
    const re = /\\\\([^\\\\]+)\\\\/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      pushSegment(out, line.slice(last, m.index), false);
      pushSegment(out, m[1] ?? "", true);
      last = m.index + m[0].length;
    }
    pushSegment(out, line.slice(last), false);
    if (li > 0 && out[first]) out[first].br = true;
  });
  return out;
});

// "||"-separated description segments alternate phosphor highlights.
const descriptionParts = computed(() => (props.settings.description || "").split("||"));
</script>

<template>
  <section class="relative grid grid-cols-[1.25fr_.9fr] items-start gap-[60px] border-b border-line pb-[72px] pt-[88px] max-md:grid-cols-1 max-md:gap-10">
    <div class="ops-glow" aria-hidden="true" />
    <div>
      <div class="rise mb-6 font-mono text-[12px] uppercase tracking-[0.22em] text-amber" style="--d: 0ms">
        // full-stack · devops · cloud
      </div>
      <h1
        class="rise text-[clamp(2.7rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.025em] text-bright"
        style="--d: 90ms"
      >
        <template v-for="(seg, i) in titleSegments" :key="i">
          <br v-if="seg.br" />
          <span v-if="seg.dim" class="font-normal text-dim">{{ seg.before }}</span>
          <template v-else-if="seg.name">
            {{ seg.before }}<span class="text-phosphor">{{ seg.name }}</span>{{ seg.after }}
          </template>
          <template v-else>{{ seg.before }}</template>
        </template>
      </h1>
      <p class="rise mt-[26px] max-w-[46ch] text-[1.02rem] text-dim" style="--d: 180ms">
        <template v-for="(part, index) in descriptionParts" :key="index">
          <span v-if="index % 2 === 1" class="text-phosphor">{{ part }}</span>
          <template v-else>{{ part }}</template>
        </template>
      </p>
      <div class="rise mt-9 flex flex-wrap gap-3.5" style="--d: 270ms">
        <NuxtLink
          :to="settings.primaryButtonLink || '#'"
          class="border border-phosphor px-[22px] py-3 font-mono text-[13.5px] text-phosphor transition-colors hover:bg-phosphor/10"
        >
          {{ settings.primaryButtonText }}
        </NuxtLink>
        <NuxtLink
          :to="settings.secondaryButtonLink || '#'"
          class="border border-line px-[22px] py-3 font-mono text-[13.5px] text-text-secondary transition-colors hover:border-dim"
        >
          {{ settings.secondaryButtonText }}
        </NuxtLink>
      </div>
    </div>

    <figure
      class="rise brackets m-0 border border-line bg-panel/70"
      style="--d: 220ms"
      :aria-label="`${operatorName} — ${isOpenToWork ? 'on shift' : 'standby'}`"
    >
      <div class="flex justify-between border-b border-line px-[18px] py-3 font-mono text-[11.5px] uppercase tracking-[0.16em] text-dim">
        <span>{{ isOpenToWork ? "on shift" : "standby" }}</span>
        <span v-if="isOpenToWork" class="text-phosphor">available for work</span>
      </div>
      <div class="group relative overflow-hidden">
        <img
          v-if="settings.imageUrl"
          :src="settings.imageUrl"
          :alt="operatorName"
          class="block aspect-square w-full object-cover object-top grayscale contrast-110 brightness-90 transition-[filter] duration-[450ms] ease-out group-hover:grayscale-[0.05] group-hover:contrast-[1.02] group-hover:brightness-100"
        />
        <div v-else class="aspect-square w-full bg-panel" />
        <div
          class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(74,222,128,0.12),rgba(10,10,11,0.2))] transition-opacity duration-[450ms] group-hover:opacity-0"
        />
        <div class="scanlines" />
      </div>
      <figcaption class="flex justify-between gap-2.5 border-t border-line px-[18px] py-3 font-mono text-[12px] text-dim">
        <span class="text-text-secondary">{{ operatorName }}</span>
        <span>full-stack · devops</span>
      </figcaption>
    </figure>
  </section>
</template>
