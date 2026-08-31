<script setup lang="ts">
// /projects — full registry

type RegistryProject = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: string;
  imageUrl?: string | null;
  demoUrl?: string | null;
  repoUrl?: string | null;
  content?: string | null;
  displayOrder?: number;
};

const [{ data: projects }, { data: profileData }, { data: settings }] = await Promise.all([
  useFetch<RegistryProject[]>("/api/projects"),
  useFetch<{ profile: { email?: string; githubUrl?: string; linkedinUrl?: string; whatsappUrl?: string } | null; isOpenToWork: boolean }>("/api/profile"),
  useFetch<{ hero?: { title?: string; tagline?: string } }>("/api/projects-settings"),
]);
</script>

<template>
  <NightOpsRegistry
    :projects="projects ?? []"
    :profile="profileData?.profile ?? null"
    :available="profileData?.isOpenToWork ?? false"
    :title="settings?.hero?.title"
    :tagline="settings?.hero?.tagline"
  />
</template>
