<script setup lang="ts">
type ExperienceEntry = {
  id: string;
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  isCurrent?: boolean;
};

type EducationEntry = {
  id: string;
  institution: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
};

const props = defineProps<{
  experience: ExperienceEntry[];
  education: EducationEntry[];
}>();

const total = props.experience.length + props.education.length;
</script>

<template>
  <!-- Night-ops service record panel — formal roles as mission log, education as
       a `training` sub-block (`service --history --all`). Lives on the /about page. -->
  <div class="brackets border border-line bg-panel/55">
    <div class="flex items-center justify-between border-b border-line px-[18px] py-3 font-mono text-[11.5px] uppercase tracking-[0.16em] text-dim">
      <span>service record</span>
      <span>--history --all</span>
    </div>

    <div class="px-[20px] pt-[12px] font-mono text-[13px] text-dim">
      <span class="text-phosphor">$</span>{{ " " }}
      <span class="text-bright">service --history --all</span>
    </div>

    <div class="px-[20px] pb-[18px] pt-[10px] font-mono text-[13px]">
      <div v-if="experience.length > 0" class="pb-[10px] pt-[6px]">
        <div class="mb-1 text-phosphor">
          ┌ experience
          <span class="ml-2 text-[11px] text-dim">×{{ experience.length }}</span>
        </div>
        <div v-for="(job, i) in experience" :key="job.id" class="py-[5px]">
          <div class="flex flex-wrap items-baseline gap-x-[10px] gap-y-[2px] text-text-secondary">
            <span class="text-dim">{{ i === experience.length - 1 ? "└─" : "├─" }}</span>
            <span>
              {{ job.position.toLowerCase() }} <span class="text-dim">@</span>{{ " " }}{{ job.company.toLowerCase() }}
            </span>
            <span class="ml-auto whitespace-nowrap text-[11.5px] text-dim">
              {{ job.startDate }} → {{ job.isCurrent ? "present" : job.endDate || "—" }}
            </span>
          </div>
          <p class="max-w-[80ch] pl-[26px] pt-[2px] text-[12.5px] leading-relaxed text-dim">
            {{ job.description }}
          </p>
        </div>
      </div>

      <div v-if="education.length > 0" class="pb-[10px] pt-[6px]">
        <div class="mb-1 text-phosphor">
          ┌ training &amp; education
          <span class="ml-2 text-[11px] text-dim">×{{ education.length }}</span>
        </div>
        <div
          v-for="(ed, i) in education"
          :key="ed.id"
          class="flex flex-wrap items-baseline gap-x-[10px] gap-y-[2px] py-[1.5px] text-text-secondary"
        >
          <span class="text-dim">{{ i === education.length - 1 ? "└─" : "├─" }}</span>
          <span>
            {{ ed.title.toLowerCase() }} <span class="text-dim">·</span>{{ " " }}{{ ed.institution.toLowerCase() }}
          </span>
          <span class="ml-auto whitespace-nowrap text-[11.5px] text-dim">
            {{ ed.startDate }} – {{ ed.endDate }}
          </span>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between border-t border-line px-[20px] py-[9px] font-mono text-[10.5px] uppercase tracking-[0.13em] text-dim">
      <span>
        records: {{ total }} · roles: {{ experience.length }} · training: {{ education.length }}
      </span>
      <span>exit 0</span>
    </div>
  </div>
</template>
