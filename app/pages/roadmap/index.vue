<script setup lang="ts">
type RoadmapItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  status: string;
  tags: string[];
};

type ProfileLinks = {
  profile: { email?: string; githubUrl?: string; linkedinUrl?: string; whatsappUrl?: string } | null;
  isOpenToWork?: boolean;
};

type RoadmapSettings = {
  hero?: { title?: string; description?: string };
} | null;

// root layout in app.vue owns metadata (no page-level metadata)
const [{ data: items }, { data: profileRes }, { data: settings }] = await Promise.all([
  useFetch<RoadmapItem[]>("/api/roadmap"),
  useFetch<ProfileLinks>("/api/profile"),
  useFetch<RoadmapSettings>("/api/roadmap-settings"),
]);

const profile = computed(() => profileRes.value?.profile ?? null);
const available = computed(() => profileRes.value?.isOpenToWork ?? false);
</script>

<template>
  <NightOpsCareerLogPage
    :items="items ?? []"
    :profile="profile"
    :available="available"
    :hero-title="settings?.hero?.title"
    :hero-subtitle="settings?.hero?.description"
  />
</template>
