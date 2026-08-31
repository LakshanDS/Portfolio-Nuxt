<script setup lang="ts">
// Roadmap items
// CRUD + roadmap page settings, rebuilt in the Night Ops dashboard style.
// Endpoints: GET/POST /api/roadmap-settings, GET/POST/PUT/DELETE /api/roadmap/manage.
definePageMeta({ layout: "jasladmin-dashboard" });

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  status: string;
  tags: string[];
}

interface RoadmapSettings {
  hero: { title: string; description: string };
}

interface RoadmapForm {
  title: string;
  description: string;
  date: string;
  category: string;
  status: string;
  tags: string[];
}

// structural empty state — real defaults live in server/api/roadmap-settings.get.ts
const emptySettings = (): RoadmapSettings => ({ hero: { title: "", description: "" } });

const emptyForm = (): RoadmapForm => ({
  title: "",
  description: "",
  date: "",
  category: "devops",
  status: "planned",
  tags: [],
});

const toast = useToast();

const items = ref<RoadmapItem[]>([]);
const settings = ref<RoadmapSettings>(emptySettings());
const isLoading = ref(true);
const loadError = ref(false);
const hasChanges = ref(false);
const isSavingSettings = ref(false);
const isEditing = ref<string | null>(null);
const isAdding = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const deleteTarget = ref<string | null>(null);
const formData = ref<RoadmapForm>(emptyForm());
const tagInput = ref("");

const editorRef = ref<HTMLElement | null>(null);

const inputClass =
  "w-full border border-line bg-transparent px-3 py-2 text-sm text-bright placeholder:text-dim/60 focus:border-phosphor focus:outline-none";
const labelClass = "block font-mono text-[11px] uppercase tracking-[0.14em] text-dim";

const categorySuggestions = ["DevOps", "Career", "Learning", "Goals"];

const categoryDatalist = computed(() => [
  ...categorySuggestions,
  ...Array.from(new Set(items.value.map((item) => item.category))).filter((c) => !categorySuggestions.includes(c)),
]);

async function loadData() {
  isLoading.value = true;
  try {
    items.value = await $fetch<RoadmapItem[]>("/api/roadmap/manage");
    // the API always returns complete settings (server defaults merged in)
    const s = await $fetch<RoadmapSettings>("/api/roadmap-settings");
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
    await $fetch("/api/roadmap-settings", { method: "POST", body: settings.value });
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
    settings.value = await $fetch<RoadmapSettings>("/api/roadmap-settings", { query: { defaults: 1 } });
    hasChanges.value = true;
  }
}

function openAdd() {
  formData.value = emptyForm();
  isAdding.value = true;
  isEditing.value = null;
  scrollToEditor();
}

function editItem(item: RoadmapItem) {
  formData.value = { ...emptyForm(), ...item };
  isEditing.value = item.id;
  isAdding.value = false;
  scrollToEditor();
}

function scrollToEditor() {
  nextTick(() => editorRef.value?.scrollIntoView({ behavior: "smooth", block: "start" }));
}

function closeEditor() {
  isEditing.value = null;
  isAdding.value = false;
  formData.value = emptyForm();
}

async function saveItem() {
  isSaving.value = true;
  try {
    if (isEditing.value) {
      await $fetch("/api/roadmap/manage", {
        method: "PUT",
        body: { id: isEditing.value, ...formData.value },
      });
      toast.success("Roadmap item updated");
    } else {
      await $fetch("/api/roadmap/manage", { method: "POST", body: formData.value });
      toast.success("Roadmap item created");
    }
    closeEditor();
    await loadData();
  } catch (error: any) {
    toast.error(error?.data?.error || "Failed to save item");
  } finally {
    isSaving.value = false;
  }
}

function confirmDelete() {
  if (deleteTarget.value) {
    isDeleting.value = true;
    $fetch("/api/roadmap/manage", { method: "DELETE", query: { id: deleteTarget.value } })
      .then(() => toast.success("Roadmap item deleted"))
      .catch((error: any) => {
        toast.error(error?.data?.error || "Failed to delete item");
      })
      .finally(async () => {
        isDeleting.value = false;
        deleteTarget.value = null;
        await loadData();
      });
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

function statusBadgeVariant(status: string): "success" | "warning" | "outline" {
  return status === "completed" ? "success" : status === "in-progress" ? "warning" : "outline";
}

function statusTitleClass(status: string) {
  return status === "completed" ? "text-bright" : status === "in-progress" ? "text-phosphor" : "text-dim";
}
</script>

<template>
  <div class="space-y-6">
    <!-- page header -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-medium text-bright"><span class="text-phosphor">// </span>Roadmap Console</h1>
        <p class="text-sm text-dim">Configure roadmap page and manage timeline</p>
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
      <!-- editor panel -->
      <section v-if="isAdding || isEditing" ref="editorRef" class="brackets scroll-mt-6 border border-line bg-panel">
        <div class="flex items-center justify-between border-b border-line p-5">
          <h2 class="font-mono text-sm uppercase tracking-[0.14em] text-bright">
            {{ isEditing ? "Edit Roadmap Item" : "Add New Item" }}
          </h2>
          <button type="button" class="text-dim transition-colors hover:text-bright" @click="closeEditor">
            <Icon name="fa:times" size="16" />
          </button>
        </div>

        <form class="space-y-6 p-5" @submit.prevent="saveItem">
          <div class="grid gap-5 md:grid-cols-2">
            <div class="space-y-2">
              <label :class="labelClass">Title</label>
              <input v-model="formData.title" type="text" :class="inputClass" required />
            </div>
            <div class="space-y-2">
              <label :class="labelClass">Date / Quarter</label>
              <input v-model="formData.date" type="text" :class="inputClass" placeholder="e.g. Q4 2024" required />
            </div>
          </div>

          <div class="space-y-2">
            <label :class="labelClass">Description</label>
            <textarea v-model="formData.description" :class="inputClass" class="min-h-[80px] resize-none" required />
          </div>

          <div class="grid gap-5 border-t border-line pt-5 md:grid-cols-2">
            <div class="space-y-2">
              <label :class="labelClass">Category</label>
              <input v-model="formData.category" type="text" :class="inputClass" list="roadmap-category-suggestions" placeholder="e.g. DevOps" />
              <datalist id="roadmap-category-suggestions">
                <option v-for="category in categoryDatalist" :key="category" :value="category" />
              </datalist>
            </div>
            <div class="space-y-2">
              <label :class="labelClass">Status</label>
              <select v-model="formData.status" :class="inputClass">
                <option value="completed" class="bg-panel text-bright">Completed</option>
                <option value="in-progress" class="bg-panel text-bright">In Progress</option>
                <option value="planned" class="bg-panel text-bright">Planned</option>
              </select>
            </div>
          </div>

          <div class="space-y-2 border-t border-line pt-5">
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

          <div class="flex justify-end gap-2 border-t border-line pt-5">
            <UiButton type="button" variant="ghost" size="sm" @click="closeEditor">Cancel</UiButton>
            <UiButton type="submit" variant="primary" size="sm" :is-loading="isSaving">
              <Icon v-if="!isSaving" name="fa:save" size="12" />
              {{ isEditing ? "Update" : "Create" }}
            </UiButton>
          </div>
        </form>
      </section>

      <!-- settings + list -->
      <div class="grid gap-5 lg:grid-cols-3">
        <!-- page settings -->
        <UiCard class="lg:col-span-1">
          <div class="flex items-center gap-3 border-b border-line p-5">
            <div class="border border-phosphor/30 bg-phosphor/10 p-2.5 text-phosphor">
              <Icon name="fa:map-signs" size="16" />
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
                placeholder="career.log"
                @input="hasChanges = true"
              />
            </div>

            <div class="space-y-2">
              <label :class="labelClass">Tagline</label>
              <textarea
                v-model="settings.hero.description"
                :class="inputClass"
                class="min-h-[80px] resize-none"
                placeholder="every entry, from fun hobby to life career."
                @input="hasChanges = true"
              />
            </div>
          </div>
        </UiCard>

        <!-- roadmap items list -->
        <UiCard class="lg:col-span-2">
          <div class="flex flex-wrap items-center justify-between gap-3 p-5">
            <div class="flex items-center gap-3">
              <div class="border border-phosphor/30 bg-phosphor/10 p-2.5 text-phosphor">
                <Icon name="fa:map-signs" size="16" />
              </div>
              <div>
                <h2 class="font-mono text-sm uppercase tracking-[0.14em] text-bright">Roadmap Items</h2>
                <p class="text-xs text-dim">{{ items.length }} items in timeline</p>
              </div>
            </div>
            <UiButton variant="primary" size="sm" @click="openAdd">
              <Icon name="fa:plus" size="12" /> Add Item
            </UiButton>
          </div>

          <div v-if="items.length" class="max-h-[calc(100vh-220px)] overflow-y-auto">
            <div
              v-for="item in items"
              :key="item.id"
              class="border-t border-line px-5 py-4 transition-colors"
              :class="isEditing === item.id ? 'border-l-2 border-l-phosphor bg-panel/60' : 'hover:bg-panel/70'"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm font-semibold" :class="statusTitleClass(item.status)">{{ item.title }}</h3>
                  <div class="mt-1 flex flex-wrap items-center gap-2">
                    <span class="text-[10px] text-[#d4d4ce]">{{ item.date }}</span>
                    <UiBadge variant="outline" class="text-[10px]">{{ item.category }}</UiBadge>
                    <UiBadge :variant="statusBadgeVariant(item.status)" class="text-[10px]">{{ item.status }}</UiBadge>
                  </div>
                </div>
                <div class="flex gap-1">
                  <button
                    type="button"
                    class="p-1.5 text-dim transition-colors hover:text-phosphor"
                    title="Edit item"
                    @click="editItem(item)"
                  >
                    <Icon name="fa-solid:pen" size="12" />
                  </button>
                  <button
                    type="button"
                    class="p-1.5 text-dim transition-colors hover:text-[#EF4444]"
                    title="Delete item"
                    @click="deleteTarget = item.id"
                  >
                    <Icon name="fa:trash" size="12" />
                  </button>
                </div>
              </div>

              <p class="mt-2 line-clamp-2 text-xs leading-relaxed text-[#d4d4ce]">{{ item.description }}</p>

              <div class="mt-3 flex flex-wrap gap-1">
                <UiBadge v-for="tag in item.tags.slice(0, 3)" :key="tag" variant="ghost" class="text-[10px]">{{ tag }}</UiBadge>
                <UiBadge v-if="item.tags.length > 3" variant="ghost" class="text-[10px]">+{{ item.tags.length - 3 }}</UiBadge>
              </div>
            </div>
          </div>

          <div v-else class="p-5">
            <div class="border border-dashed border-line bg-panel/20 py-12 text-center">
              <Icon name="fa:map-signs" size="32" class="mx-auto mb-3 text-dim/40" />
              <p class="mb-3 text-sm text-[#d4d4ce]">No roadmap items yet</p>
              <UiButton variant="primary" size="sm" @click="openAdd">
                <Icon name="fa:plus" size="12" /> Add Your First Item
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
              <h3 class="font-mono text-sm uppercase tracking-[0.14em] text-bright">Delete Roadmap Item</h3>
              <p class="mt-2 text-sm text-[#d4d4ce]">Are you sure you want to delete this roadmap item? This action cannot be undone.</p>
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
