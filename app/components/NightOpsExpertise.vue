<script setup lang="ts">
type Competency = {
  id: string;
  title: string;
  description: string;
  expertise: string;
  tags?: string[];
};

const props = defineProps<{ competencies: Competency[] }>();

// all four dashboard levels get a distinct readout; unknown falls back to expert
function levelFor(expertise: string): { mark: string; markCls: string; barCls: string; bar: number; spread: number } {
  switch (expertise.toLowerCase()) {
    case "advanced":
      return { mark: "[ ADV ]", markCls: "text-cyan-300", barCls: "bg-cyan-400/50", bar: 68, spread: 11 };
    case "intermediate":
      return { mark: "[ INT ]", markCls: "text-yellow-300", barCls: "bg-yellow-300/50", bar: 54, spread: 14 };
    case "beginner":
      return { mark: "[ BEG ]", markCls: "text-[#ff8a4d]", barCls: "bg-[#ff8a4d]/45", bar: 30, spread: 17 };
    default:
      return { mark: "[ EXP ]", markCls: "text-phosphor", barCls: "bg-phosphor/60", bar: 80, spread: 12 };
  }
}

// deterministic per-tag spread so equal levels don't render identical bars
function tagHash(tag: string): number {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) % 997;
  return h;
}

function barWidth(tag: string, bar: number, spread: number): string {
  return `${bar + (tagHash(tag) % spread)}%`;
}
</script>

<template>
  <section id="expertise" class="expertise relative border-b border-line py-16">
    <div class="mb-[30px] flex items-baseline justify-between" data-reveal>
      <h2 class="text-[1.3rem] font-medium text-bright">
        <span class="font-mono text-phosphor">// </span>areas of expertise --all
      </h2>
      <span class="font-mono text-[12.5px] text-dim">
        competency scan · {{ props.competencies.length }} modules detected
      </span>
    </div>

    <div class="brackets relative overflow-hidden border border-line bg-panel/55">
      <div class="scanline" />

      <div class="flex items-center justify-between border-b border-line px-[18px] py-3 font-mono text-[11.5px] uppercase tracking-[0.16em] text-dim">
        <span class="flex items-center gap-[9px]">
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-phosphor" />
          competency readout
        </span>
        <span>scan: complete</span>
      </div>

      <div class="px-[18px] pb-1 pt-[13px] font-mono text-[13px] text-dim">
        <span class="text-phosphor">$</span>
        <span class="text-bright"> competence --list --verbose</span>
      </div>

      <div
        v-for="(competency, index) in props.competencies"
        :key="competency.id"
        data-reveal
        class="grid grid-cols-[58px_1.15fr_0.85fr] gap-[18px] px-[18px] py-4 max-md:grid-cols-1"
      >
        <span
          class="whitespace-nowrap pt-[3px] font-mono text-[12px]"
          :class="levelFor(competency.expertise).markCls"
        >
          {{ levelFor(competency.expertise).mark }}
        </span>

        <div>
          <span class="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-dim">
            cc-{{ String(index + 1).padStart(2, "0") }} · {{ competency.expertise.toLowerCase() }}
          </span>
          <div class="font-mono text-[14.5px] text-bright">{{ competency.title }}</div>
          <p class="mt-[5px] max-w-[46ch] text-[0.845rem] text-dim">{{ competency.description }}</p>
        </div>

        <div class="flex flex-col gap-[7px] pt-[2px] max-md:pt-1">
          <div
            v-for="tag in competency.tags ?? []"
            :key="tag"
            class="grid grid-cols-[86px_1fr] items-center gap-[10px] font-mono text-[11px] text-dim"
          >
            <span class="truncate">{{ tag.toLowerCase() }}</span>
            <span class="relative h-[7px] border border-line">
              <span
                class="signal-fill absolute inset-y-0 left-0"
                :class="levelFor(competency.expertise).barCls"
                :style="{ '--w': barWidth(tag, levelFor(competency.expertise).bar, levelFor(competency.expertise).spread) }"
              />
            </span>
          </div>
        </div>
      </div>

      <div class="border-t border-line px-[18px] py-[10px] font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
        └─ {{ props.competencies.length }} modules nominal · levels: exp = expert · adv = advanced · int = intermediate · beg = beginner
      </div>
    </div>
  </section>
</template>
