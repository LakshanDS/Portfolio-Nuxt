<script setup lang="ts">
// Projects CRUD
// + projects page settings, rebuilt in the Night Ops dashboard style.
// Create/edit lives on the dedicated editor page (projects/new, projects/:id).
// Endpoints: GET/POST /api/projects-settings, GET /api/projects,
// DELETE /api/projects/:id.
definePageMeta({ layout: "jasladmin-dashboard" });

interface Project {
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
}

interface ProjectsSettings {
  hero: { title: string; tagline: string };
}

// structural empty state — real defaults live in server/api/projects-settings.get.ts
const emptySettings = (): ProjectsSettings => ({ hero: { title: "", tagline: "" } });

const toast = useToast();

const projects = ref<Project[]>([]);
const settings = ref<ProjectsSettings>(emptySettings());
const isLoading = ref(true);
const loadError = ref(false);
const hasChanges = ref(false);
const isSavingSettings = ref(false);
const isDeleting = ref(false);
const deleteTarget = ref<string | null>(null);

const inputClass =
  "w-full border border-line bg-transparent px-3 py-2 text-sm text-bright placeholder:text-dim/60 focus:border-phosphor focus:outline-none";
const labelClass = "block font-mono text-[11px] uppercase tracking-[0.14em] text-dim";

async function loadData() {
  isLoading.value = true;
  try {
    projects.value = await $fetch<Project[]>("/api/projects");
    // the API always returns complete settings (server defaults merged in)
    const s = await $fetch<ProjectsSettings>("/api/projects-settings");
    settings.value = { hero: { ...emptySettings().hero, ...s.hero } };
    loadError.value = false;
  } catch (error) {
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadData);

async function saveSettings() {
  isSavingSettings.value = true;
  try {
    await $fetch("/api/projects-settings", { method: "POST", body: settings.value });
    hasChanges.value = false;
    toast.success("Settings saved successfully!");
  } catch (error) {
    toast.error("Failed to save settings");
  } finally {
    isSavingSettings.value = false;
  }
}

async function resetSettings() {
  if (confirm("Reset to default settings?")) {
    settings.value = await $fetch<ProjectsSettings>("/api/projects-settings", { query: { defaults: 1 } });
    hasChanges.value = true;
  }
}

function goNew() {
  navigateTo("/jasladmin/dashboard/projects/new");
}

function goEdit(project: Project) {
  navigateTo(`/jasladmin/dashboard/projects/${project.id}`);
}

function confirmDelete() {
  if (deleteTarget.value) {
    isDeleting.value = true;
    $fetch(`/api/projects/${deleteTarget.value}`, { method: "DELETE" })
      .then(() => toast.success("Project deleted"))
      .catch((error: any) => {
        toast.error(error?.data?.error || "Failed to delete project");
      })
      .finally(async () => {
        isDeleting.value = false;
        deleteTarget.value = null;
        await loadData();
      });
  }
}

function statusBadgeVariant(status: string): "success" | "warning" | "outline" {
  return status === "live" ? "success" : status === "developing" ? "warning" : "outline";
}

function statusTitleClass(status: string) {
  return status === "live" ? "text-bright" : status === "developing" ? "text-amber" : "text-dim";
}
</script>

<template>
  <div class="space-y-6">
    <!-- page header -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-medium text-bright"><span class="text-phosphor">// </span>Projects Console</h1>
        <p class="text-sm text-dim">Configure projects page and manage portfolio</p>
      </div>
      <div class="flex gap-2">
        <UiButton variant="outline" size="sm" @click="resetSettings">
          <Icon name="fa:undo" size="12" /> Reset
        </UiButton>
        <UiButton variant="primary" size="sm" :disabled="!hasChanges" :is-loading="isSavingSettings" @click="saveSettings">
          <Icon v-if="!isSavingSettings" name="fa:save" size="12" />
          {{ hasChanges ? "Save Changes" : "Saved" }}
        </UiButton>
      </div>
    </div>

    <!-- load error -->
    <div v-if="loadError" class="flex flex-wrap items-center justify-between gap-4 border border-amber/40 bg-amber/10 p-4">
      <div class="flex items-center gap-3">
        <Icon name="fa:exclamation-triangle" size="16" class="text-amber" />
        <span class="font-mono text-xs uppercase tracking-[0.14em] text-amber">Failed to load data</span>
      </div>
      <UiButton variant="outline" size="sm" @click="loadData">Retry</UiButton>
    </div>

    <div v-if="isLoading" class="animate-pulse font-mono text-sm text-dim">loading…</div>

    <template v-else>
      <!-- settings + list -->
      <div class="grid gap-5 lg:grid-cols-3">
        <!-- page settings -->
        <UiCard class="lg:col-span-1">
          <div class="flex items-center gap-3 border-b border-line p-5">
            <div class="border border-phosphor/30 bg-phosphor/10 p-2.5 text-phosphor">
              <Icon name="fa:folder-open" size="16" />
            </div>
            <div>
              <h2 class="font-mono text-sm uppercase tracking-[0.14em] text-bright">Page Settings</h2>
              <p class="text-xs text-dim">Configure page content</p>
            </div>
          </div>

          <div class="space-y-5 p-5">
            <div class="space-y-2">
              <label :class="labelClass">Page Title</label>
              <input
                v-model="settings.hero.title"
                type="text"
                :class="inputClass"
                placeholder="Enter page title"
                @input="hasChanges = true"
              />
            </div>

            <div class="space-y-2">
              <label :class="labelClass">Tagline</label>
              <textarea
                v-model="settings.hero.tagline"
                :class="inputClass"
                class="min-h-[80px] resize-none"
                placeholder="Enter page tagline"
                @input="hasChanges = true"
              />
            </div>
          </div>
        </UiCard>

        <!-- projects list -->
        <UiCard class="lg:col-span-2">
          <div class="flex flex-wrap items-center justify-between gap-3 p-5">
            <div class="flex items-center gap-3">
              <div class="border border-phosphor/30 bg-phosphor/10 p-2.5 text-phosphor">
                <Icon name="fa:folder-open" size="16" />
              </div>
              <div>
                <h2 class="font-mono text-sm uppercase tracking-[0.14em] text-bright">Projects</h2>
                <p class="text-xs text-dim">{{ projects.length }} projects in portfolio</p>
              </div>
            </div>
            <UiButton variant="primary" size="sm" @click="goNew">
              <Icon name="fa:plus" size="12" /> Add Project
            </UiButton>
          </div>

          <div v-if="projects.length" class="max-h-[calc(100vh-220px)] overflow-y-auto">
            <div
              v-for="(project, index) in projects"
              :key="project.id"
              class="border-t border-line px-5 py-4 transition-colors hover:bg-panel/70"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm font-semibold" :class="statusTitleClass(project.status)">{{ project.title }}</h3>
                  <div class="mt-1 flex flex-wrap items-center gap-2">
                    <UiBadge v-if="index < 2" variant="default" class="text-[10px]">featured</UiBadge>
                    <UiBadge variant="secondary" class="text-[10px]">{{ project.category }}</UiBadge>
                    <UiBadge :variant="statusBadgeVariant(project.status)" class="text-[10px]">{{ project.status }}</UiBadge>
                  </div>
                </div>
                <div class="flex gap-1">
                  <button
                    type="button"
                    class="p-1.5 text-dim transition-colors hover:text-phosphor"
                    title="Edit project"
                    @click="goEdit(project)"
                  >
                    <Icon name="fa-solid:pen" size="12" />
                  </button>
                  <button
                    type="button"
                    class="p-1.5 text-dim transition-colors hover:text-[#EF4444]"
                    title="Delete project"
                    @click="deleteTarget = project.id"
                  >
                    <Icon name="fa:trash" size="12" />
                  </button>
                </div>
              </div>

              <p class="mt-2 line-clamp-2 text-xs leading-relaxed text-[#d4d4ce]">{{ project.description }}</p>

              <div class="mt-3 flex flex-wrap gap-1">
                <UiBadge v-for="tag in project.tags.slice(0, 3)" :key="tag" variant="ghost" class="text-[10px]">{{ tag }}</UiBadge>
                <UiBadge v-if="project.tags.length > 3" variant="ghost" class="text-[10px]">+{{ project.tags.length - 3 }}</UiBadge>
              </div>

              <div class="mt-3 flex gap-2">
                <a
                  :href="project.demoUrl || '#'"
                  target="_blank"
                  :rel="project.demoUrl ? 'noopener noreferrer' : 'nofollow'"
                  class="inline-flex items-center gap-1 px-2 py-1 font-mono text-[10px] font-medium"
                  :class="project.demoUrl ? 'bg-phosphor/20 text-phosphor hover:bg-phosphor/30' : 'cursor-not-allowed bg-line/20 text-dim'"
                >
                  <Icon name="fa-solid:external-link-alt" size="9" /> Demo
                </a>
                <a
                  :href="project.repoUrl || '#'"
                  target="_blank"
                  :rel="project.repoUrl ? 'noopener noreferrer' : 'nofollow'"
                  class="inline-flex items-center gap-1 px-2 py-1 font-mono text-[10px] font-medium"
                  :class="project.repoUrl ? 'bg-phosphor/20 text-phosphor hover:bg-phosphor/30' : 'cursor-not-allowed bg-line/20 text-dim'"
                >
                  <Icon name="fa-solid:external-link-alt" size="9" /> Repo
                </a>
              </div>
            </div>
          </div>

          <div v-else class="p-5">
            <div class="border border-dashed border-line bg-panel/20 py-12 text-center">
              <Icon name="fa:folder-open" size="32" class="mx-auto mb-3 text-dim/40" />
              <p class="mb-3 text-sm text-[#d4d4ce]">No projects yet</p>
              <UiButton variant="primary" size="sm" @click="goNew">
                <Icon name="fa:plus" size="12" /> Add Your First Project
              </UiButton>
            </div>
          </div>
        </UiCard>
      </div>
    </template>

    <!-- delete confirm -->
    <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div class="brackets w-full max-w-md border border-line bg-panel shadow-2xl">
        <div class="border-b border-line p-6">
          <div class="flex items-start gap-4">
            <div class="shrink-0 border border-amber/30 bg-amber/10 p-3">
              <Icon name="fa:exclamation-triangle" size="22" class="text-amber" />
            </div>
            <div>
              <h3 class="font-mono text-sm uppercase tracking-[0.14em] text-bright">Delete Project</h3>
              <p class="mt-2 text-sm text-[#d4d4ce]">Are you sure you want to delete this project? This action cannot be undone.</p>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 bg-panel/50 p-6">
          <UiButton variant="ghost" size="sm" @click="deleteTarget = null">Cancel</UiButton>
          <button
            type="button"
            :disabled="isDeleting"
            class="inline-flex items-center gap-2 border border-amber/40 px-3 py-1.5 font-mono text-xs font-medium text-amber transition-all hover:bg-amber/10 disabled:cursor-not-allowed disabled:opacity-50"
            @click="confirmDelete"
          >
            <Icon v-if="isDeleting" name="fa:spinner" size="12" class="animate-spin" />
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
