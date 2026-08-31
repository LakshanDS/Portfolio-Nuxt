<script setup lang="ts">
type AboutPageData = {
  profile: {
    name: string;
    title: string;
    email: string;
    profileImage?: string | null;
    githubUrl: string;
    linkedinUrl: string;
  } | null;
  isOpenToWork: boolean;
  stats: {
    pipelinesFixed: string;
    projectsCount: number;
    selfCommits: number;
    experience: string;
    resumeDownloads: number;
  } | null;
  cards: { id: string; title: string; content: string }[];
  education: {
    id: string;
    title: string;
    institution: string;
    description: string;
    startDate: string;
    endDate: string;
  }[];
  experience: {
    id: string;
    position: string;
    company: string;
    description: string;
    startDate: string;
    endDate?: string | null;
    isCurrent: boolean;
  }[];
  settings: {
    hero?: { terminalBio?: string[]; profileImage?: string };
  } | null;
};

const { data } = await useFetch<AboutPageData>("/api/about-page");

const terminalBio = computed(() => data.value?.settings?.hero?.terminalBio ?? []);
const profileImage = computed(
  () => data.value?.settings?.hero?.profileImage || data.value?.profile?.profileImage || "/myself.jpeg",
);
</script>

<template>
  <NightOpsAbout
    :profile="data?.profile ?? null"
    :available="data?.isOpenToWork ?? false"
    :stats="data?.stats ?? null"
    :cards="data?.cards ?? []"
    :education="data?.education ?? []"
    :experience="data?.experience ?? []"
    :terminal-bio="terminalBio"
    :profile-image="profileImage"
  />
</template>
