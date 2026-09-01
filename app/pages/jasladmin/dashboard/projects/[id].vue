<script setup lang="ts">
// Dedicated project editor — /jasladmin/dashboard/projects/new creates,
// /jasladmin/dashboard/projects/:id edits. Info fields + image upload in the
// left third, markdown editor in the right two thirds.
// Endpoints: GET/PUT /api/projects/:id, POST /api/projects/create, POST /api/upload.
import { marked } from "marked";

definePageMeta({ layout: "jasladmin-dashboard" });

interface ProjectForm {
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: string;
  year: string;
  imageUrl: string;
  demoUrl: string;
  repoUrl: string;
  content: string;
  displayOrder: number;
}

const route = useRoute();
const projectId = route.params.id as string;
const isEdit = projectId !== "new";

const emptyForm = (): ProjectForm => ({
  title: "",
  description: "",
  category: "Cloud",
  tags: [],
  status: "live",
  year: "",
  imageUrl: "",
  demoUrl: "",
  repoUrl: "",
  content: "",
  displayOrder: 999,
});

const toast = useToast();

const formData = ref<ProjectForm>(emptyForm());
const isLoading = ref(isEdit);
const loadError = ref(false);
const isSaving = ref(false);
const isUploading = ref(false);
const tagInput = ref("");
const showPreview = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const inputClass =
  "w-full border border-line bg-transparent px-3 py-2 text-sm text-bright placeholder:text-dim/60 focus:border-phosphor focus:outline-none";
const labelClass = "block font-mono text-[11px] uppercase tracking-[0.14em] text-dim";

const categories = ["Cloud", "Infrastructure", "Full Stack", "DevOps", "AI/ML"];

const renderedContent = computed(() => marked.parse(formData.value.content || "") as string);

onMounted(async () => {
  if (!isEdit) return;
  try {
    const project = await $fetch<Record<string, any>>(`/api/projects/${projectId}`);
    formData.value = {
      title: project.title || "",
      description: project.description || "",
      category: project.category || "Cloud",
      tags: project.tags || [],
      status: project.status || "live",
      year: project.year || "",
      imageUrl: project.imageUrl || "",
      demoUrl: project.demoUrl || "",
      repoUrl: project.repoUrl || "",
      content: project.content || "",
      displayOrder: project.displayOrder ?? 999,
    };
  } catch (error) {
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
});

async function saveProject() {
  if (!formData.value.title.trim()) {
    toast.error("Title is required");
    return;
  }
  isSaving.value = true;
  try {
    if (isEdit) {
      await $fetch(`/api/projects/${projectId}`, { method: "PUT", body: formData.value });
      toast.success("Project updated");
    } else {
      await $fetch("/api/projects/create", { method: "POST", body: formData.value });
      toast.success("Project created");
    }
    navigateTo("/jasladmin/dashboard/projects");
  } catch (error: any) {
    toast.error(error?.data?.error || "Failed to save project");
  } finally {
    isSaving.value = false;
  }
}

function addTag() {
  const tag = tagInput.value.trim();
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags = [...formData.value.tags, tag];
  }
  tagInput.value = "";
}

function removeTag(tag: string) {
  formData.value.tags = formData.value.tags.filter((t) => t !== tag);
}

// form semantics: parseInt || 999
function updateDisplayOrder(e: Event) {
  formData.value.displayOrder = parseInt((e.target as HTMLInputElement).value) || 999;
}

async function handleImageUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  isUploading.value = true;
  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("prefix", "project");
    const res = await $fetch<{ success: boolean; filePath?: string; error?: string }>("/api/upload", {
      method: "POST",
      body: fd,
    });
    if (res.success && res.filePath) {
      formData.value.imageUrl = res.filePath;
      toast.success("Image uploaded");
    } else {
      toast.error(res.error || "Failed to upload image");
    }
  } catch (error: any) {
    toast.error(error?.data?.error || "Failed to upload image");
  } finally {
    isUploading.value = false;
    input.value = "";
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- page header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/jasladmin/dashboard/projects"
          class="border border-line p-2 text-dim transition-colors hover:border-phosphor/40 hover:text-bright"
          title="Back to projects"
        >
          <Icon name="fa:arrow-left" size="14" />
        </NuxtLink>
        <div>
          <h1 class="text-xl font-medium text-bright">
            <span class="text-phosphor">// </span>{{ isEdit ? "Edit Project" : "New Project" }}
          </h1>
          <p class="text-sm text-dim">{{ isEdit ? "Update project details and content" : "Add a project to the portfolio" }}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <UiButton variant="ghost" size="sm" @click="navigateTo('/jasladmin/dashboard/projects')">Cancel</UiButton>
        <UiButton variant="primary" size="sm" :disabled="isLoading || loadError" :is-loading="isSaving" @click="saveProject">
          <Icon v-if="!isSaving" name="fa:save" size="12" />
          {{ isEdit ? "Update Project" : "Create Project" }}
        </UiButton>
      </div>
    </div>

    <div v-if="isLoading" class="animate-pulse font-mono text-sm text-dim">loading…</div>

    <div v-else-if="loadError" class="flex flex-wrap items-center justify-between gap-4 border border-amber/40 bg-amber/10 p-4">
      <div class="flex items-center gap-3">
        <Icon name="fa:exclamation-triangle" size="16" class="text-amber" />
        <span class="font-mono text-xs uppercase tracking-[0.14em] text-amber">Project not found</span>
      </div>
      <UiButton variant="outline" size="sm" @click="navigateTo('/jasladmin/dashboard/projects')">Back to projects</UiButton>
    </div>

    <template v-else>
      <div class="grid gap-5 lg:grid-cols-3">
        <!-- project info, left third -->
        <section class="border border-line bg-panel lg:col-span-1">
          <div class="border-b border-line p-5">
            <h2 class="font-mono text-sm uppercase tracking-[0.14em] text-bright">Project Information</h2>
          </div>

          <div class="space-y-5 p-5">
            <div class="grid grid-cols-3 gap-4">
              <div class="col-span-2 space-y-2">
                <label :class="labelClass">Name</label>
                <input v-model="formData.title" type="text" :class="inputClass" placeholder="Project name" />
              </div>
              <div class="space-y-2">
                <label :class="labelClass">Status</label>
                <div class="relative">
                  <select v-model="formData.status" :class="inputClass" class="appearance-none pr-8">
                    <option value="live" class="bg-panel text-bright">Live</option>
                    <option value="developing" class="bg-panel text-bright">Developing</option>
                    <option value="archived" class="bg-panel text-bright">Archived</option>
                  </select>
                  <Icon name="fa:chevron-down" size="12" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-dim" />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-4 gap-4">
              <div class="col-span-2 space-y-2">
                <label :class="labelClass">Category</label>
                <div class="relative">
                  <select v-model="formData.category" :class="inputClass" class="appearance-none pr-8">
                    <option v-for="category in categories" :key="category" :value="category" class="bg-panel text-bright">
                      {{ category }}
                    </option>
                  </select>
                  <Icon name="fa:chevron-down" size="12" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-dim" />
                </div>
              </div>
              <div class="space-y-2">
                <label :class="labelClass">Year</label>
                <input v-model="formData.year" type="text" :class="inputClass" placeholder="2026 Q1" />
              </div>
              <div class="space-y-2">
                <label :class="labelClass">Display Order</label>
                <input
                  :value="formData.displayOrder"
                  type="number"
                  min="1"
                  max="999"
                  :class="inputClass"
                  placeholder="999 (default)"
                  @input="updateDisplayOrder"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label :class="labelClass">Description</label>
              <textarea
                v-model="formData.description"
                :class="inputClass"
                class="min-h-[100px] resize-none"
                placeholder="Short summary shown on cards"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label :class="labelClass">Demo URL</label>
                <input v-model="formData.demoUrl" type="url" :class="inputClass" placeholder="https://…" />
              </div>
              <div class="space-y-2">
                <label :class="labelClass">Repository URL</label>
                <input v-model="formData.repoUrl" type="url" :class="inputClass" placeholder="https://…" />
              </div>
            </div>

            <div class="space-y-2">
              <label :class="labelClass">Tags</label>
              <div class="flex gap-2">
                <input
                  v-model="tagInput"
                  type="text"
                  :class="inputClass"
                  placeholder="Press Enter to add tag"
                  @keydown.enter.prevent="addTag"
                />
                <UiButton type="button" variant="primary" size="sm" @click="addTag">Add</UiButton>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <UiBadge v-for="tag in formData.tags" :key="tag" variant="secondary" class="gap-1 text-xs">
                  {{ tag }}
                  <button type="button" class="ml-1 text-dim transition-colors hover:text-bright" @click="removeTag(tag)">
                    <Icon name="fa:times" size="10" />
                  </button>
                </UiBadge>
              </div>
            </div>

            <div class="space-y-2">
              <label :class="labelClass">Cover Image</label>
              <div class="flex aspect-video w-full items-center justify-center overflow-hidden border border-dashed border-line bg-panel/40">
                <img v-if="formData.imageUrl" :src="formData.imageUrl" alt="Project cover preview" class="h-full w-full object-cover" />
                <Icon v-else name="fa:image" size="32" class="text-dim/40" />
              </div>
              <input ref="fileInputRef" type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" class="hidden" @change="handleImageUpload" />
              <UiButton type="button" variant="outline" size="sm" class="w-full justify-center" :is-loading="isUploading" @click="fileInputRef?.click()">
                <Icon v-if="!isUploading" name="fa:upload" size="11" /> Upload image
              </UiButton>
            </div>
          </div>
        </section>

        <!-- markdown editor, right two thirds -->
        <section class="border border-line bg-panel lg:col-span-2">
          <div class="flex items-center justify-between border-b border-line p-5">
            <h2 class="font-mono text-sm uppercase tracking-[0.14em] text-bright">Content (Markdown)</h2>
            <div class="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
              <button
                type="button"
                :class="!showPreview ? 'text-phosphor' : 'text-dim transition-colors hover:text-bright'"
                @click="showPreview = false"
              >
                Edit
              </button>
              <span class="text-dim">/</span>
              <button
                type="button"
                :class="showPreview ? 'text-phosphor' : 'text-dim transition-colors hover:text-bright'"
                @click="showPreview = true"
              >
                Preview
              </button>
            </div>
          </div>

          <div class="p-5">
            <textarea
              v-show="!showPreview"
              v-model="formData.content"
              :class="inputClass"
              class="min-h-[60vh] resize-y font-mono leading-relaxed"
              placeholder="# Project deep-dive&#10;&#10;Write the full project write-up in markdown…"
            />
            <div v-if="showPreview" class="prose-nightops min-h-[60vh] border border-line p-4" v-html="renderedContent" />
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
