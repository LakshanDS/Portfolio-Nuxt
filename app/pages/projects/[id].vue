<script setup lang="ts">
// /projects/[id] — project dossier
type Project = {
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
  updatedAt?: string | null;
};

const route = useRoute();
const id = String(route.params.id);

const [{ data: project, error }, { data: projects }] = await Promise.all([
  useFetch<Project>(`/api/projects/${id}`),
  useFetch<Project[]>("/api/projects"),
]);

if (error.value || !project.value) {
  throw createError({ statusCode: 404, statusMessage: "Project not found", fatal: true });
}

// registry position — same order the /projects page numbers its cards
const registry = computed(() => {
  const list = projects.value;
  if (!list) return undefined;
  const index = list.findIndex((p) => p.id === project.value!.id);
  return index >= 0 ? { no: index + 1, total: list.length } : undefined;
});
</script>

<template>
  <ProjectDetailView v-if="project" :project="project" :registry="registry" />
</template>
