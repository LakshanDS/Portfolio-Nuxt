<script setup lang="ts">
// Edit-only
// CRUD for the core competencies via /api/core-competencies (GET) and
// /api/core-competencies/manage (PUT); tags are stored as JSON strings.
definePageMeta({ layout: "jasladmin-dashboard" });

interface Competency {
  id: string;
  title: string;
  description: string;
  expertise: string;
  tags: string;
  icon?: string | null;
}

const toast = useToast();

const competencies = ref<Competency[]>([]);
const isLoading = ref(true);
const loadError = ref(false);

const editingId = ref<string | null>(null);
const isSaving = ref(false);
const form = ref({ title: "", description: "", expertise: "", tags: "", icon: "", newTag: "" });

const inputCls =
  "w-full border border-line bg-transparent px-3 py-2 text-sm text-bright focus:border-phosphor focus:outline-none";
const labelCls = "mb-1 block font-mono text-[11px] uppercase tracking-[0.14em] text-dim";

// fallback: JSON string, or comma-separated when parsing fails
function parseTagList(tags: string): string[] {
  if (!tags) return [];
  try {
    return typeof tags === "string" ? JSON.parse(tags) : tags;
  } catch {
    return tags.split(",").map((t) => t.trim()).filter(Boolean);
  }
}

const formatTags = (tags: string[]): string => JSON.stringify(tags);

const currentTags = computed(() => parseTagList(form.value.tags));

const expertiseDot: Record<string, string> = {
  Expert: "bg-phosphor",
  Advanced: "bg-cyan-400",
  Intermediate: "bg-yellow-300",
  Beginner: "bg-[#ff8a4d]",
};

async function loadData() {
  try {
    competencies.value = await $fetch<Competency[]>("/api/core-competencies");
    loadError.value = false;
  } catch (error) {
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
}
onMounted(loadData);

function openEdit(competency: Competency) {
  form.value = {
    title: competency.title,
    description: competency.description,
    expertise: competency.expertise,
    tags: competency.tags,
    icon: competency.icon || "",
    newTag: "",
  };
  editingId.value = competency.id;
}

function cancelEdit() {
  editingId.value = null;
  form.value = { title: "", description: "", expertise: "", tags: "", icon: "", newTag: "" };
}

function addTag() {
  if (!form.value.newTag.trim()) return;
  const tags = parseTagList(form.value.tags);
  if (!tags.includes(form.value.newTag.trim())) {
    form.value = { ...form.value, tags: formatTags([...tags, form.value.newTag.trim()]), newTag: "" };
  }
}

function removeTag(tag: string) {
  form.value = {
    ...form.value,
    tags: formatTags(parseTagList(form.value.tags).filter((t) => t !== tag)),
  };
}

async function handleSubmit() {
  if (!editingId.value) return;
  isSaving.value = true;
  try {
    await $fetch("/api/core-competencies/manage", {
      method: "PUT",
      body: {
        id: editingId.value,
        title: form.value.title,
        description: form.value.description,
        expertise: form.value.expertise,
        tags: form.value.tags,
        icon: form.value.icon,
      },
    });
    toast.success("Competency updated successfully!");
    cancelEdit();
    await loadData();
  } catch (error: unknown) {
    const err = error as { data?: { error?: string } };
    toast.error(err?.data?.error || "Failed to update competency");
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="space-y-5">
    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-medium text-bright">
          <span class="text-phosphor">// </span>competencies
        </h1>
        <p class="mt-1 text-sm text-dim">Manage your core competencies (3 items)</p>
      </div>
      <UiBadge variant="primary">{{ competencies.length }}</UiBadge>
    </header>

    <div v-if="isLoading" class="animate-pulse font-mono text-sm text-dim">loading…</div>

    <div v-else-if="loadError" class="border border-amber/40 bg-amber/10 p-4 text-sm text-amber">
      failed to load competencies —
      <UiButton variant="outline" size="sm" class="ml-2" @click="loadData">retry</UiButton>
    </div>

    <template v-else>
      <UiCard class="p-5">
        <div
          v-if="competencies.length === 0"
          class="border border-dashed border-[#2e2e32] bg-panel/20 px-6 py-12 text-center"
        >
          <Icon name="fa:cogs" size="32" class="mx-auto mb-3 text-[#2e2e32]" />
          <p class="text-sm text-dim">No competencies yet</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            v-for="competency in competencies"
            :key="competency.id"
            class="flex flex-col border border-line bg-panel/40 p-5 transition-colors hover:border-phosphor/40"
          >
            <div class="mb-4 flex items-start justify-between">
              <span
                class="flex h-12 w-12 items-center justify-center border border-phosphor/30 bg-phosphor/10 text-phosphor"
              >
                <!-- FaCogs fallback when no icon is set -->
                <Icon :name="competency.icon ? toIconName(competency.icon) : 'fa:cogs'" size="20" />
              </span>
              <div class="flex items-center gap-2">
                <span
                  class="h-2.5 w-2.5 rounded-full"
                  :class="expertiseDot[competency.expertise] || 'bg-dim'"
                  :title="competency.expertise"
                />
                <button
                  type="button"
                  class="rounded p-1.5 text-phosphor transition-colors hover:bg-phosphor/20"
                  aria-label="Edit competency"
                  @click="openEdit(competency)"
                >
                  <Icon name="fa-solid:pen" size="11" />
                </button>
              </div>
            </div>

            <h3 class="mb-2 text-base font-bold text-bright">{{ competency.title }}</h3>
            <p class="mb-4 flex-1 text-sm leading-relaxed text-dim">{{ competency.description }}</p>

            <div class="border-t border-line pt-4">
              <div class="mb-3 flex items-center justify-between">
                <span class="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                  technologies
                </span>
                <UiBadge variant="primary">{{ parseTagList(competency.tags).length }}</UiBadge>
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(tag, index) in parseTagList(competency.tags).slice(0, 6)"
                  :key="index"
                  class="border border-line bg-panel px-3 py-1.5 font-mono text-xs text-phosphor"
                >
                  {{ tag }}
                </span>
                <span
                  v-if="parseTagList(competency.tags).length > 6"
                  class="border border-line bg-panel px-3 py-1.5 font-mono text-xs text-dim"
                >
                  +{{ parseTagList(competency.tags).length - 6 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </UiCard>

    </template>

    <!-- competency editor modal -->
    <div
      v-if="editingId"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      @click.self="cancelEdit"
    >
      <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-line bg-panel">
        <div class="flex items-center justify-between border-b border-line p-5">
          <h3 class="font-mono text-sm uppercase tracking-[0.14em] text-bright">
            edit competency
          </h3>
          <button
            type="button"
            class="p-1.5 text-dim transition-colors hover:bg-phosphor/10 hover:text-phosphor"
            aria-label="Close editor"
            @click="cancelEdit"
          >
            <Icon name="fa:times" size="14" />
          </button>
        </div>

        <form class="space-y-4 p-5" @submit.prevent="handleSubmit">
          <div>
            <label for="comp-title" :class="labelCls">Title</label>
            <input id="comp-title" v-model="form.title" type="text" :class="inputCls" required>
          </div>
          <div>
            <label for="comp-description" :class="labelCls">Description</label>
            <textarea
              id="comp-description"
              v-model="form.description"
              :class="inputCls"
              class="min-h-[120px] resize-none"
              required
            />
          </div>
          <div>
            <label for="comp-expertise" :class="labelCls">Expertise level</label>
            <select id="comp-expertise" v-model="form.expertise" :class="inputCls" required>
              <option value="" class="bg-panel text-bright">Select expertise level</option>
              <option value="Beginner" class="bg-panel text-bright">Beginner</option>
              <option value="Intermediate" class="bg-panel text-bright">Intermediate</option>
              <option value="Advanced" class="bg-panel text-bright">Advanced</option>
              <option value="Expert" class="bg-panel text-bright">Expert</option>
            </select>
          </div>
          <UiIconPicker v-model="form.icon" label="Select an icon" />

          <div>
            <label for="comp-new-tag" :class="labelCls">Manage technologies</label>
            <div class="mt-1 space-y-3">
              <div class="flex gap-2">
                <input
                  id="comp-new-tag"
                  v-model="form.newTag"
                  type="text"
                  placeholder="Add new technology..."
                  :class="inputCls"
                  class="flex-1"
                  @keydown.enter.prevent="addTag"
                >
                <UiButton type="button" variant="outline" class="px-3" @click="addTag">
                  <Icon name="fa:plus" size="12" />
                </UiButton>
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(tag, index) in currentTags"
                  :key="index"
                  class="group flex items-center gap-2 border border-line bg-panel px-3 py-1.5 font-mono text-xs text-phosphor"
                >
                  {{ tag }}
                  <button
                    type="button"
                    class="text-dim transition-colors hover:text-[#ef4444] group-hover:opacity-100"
                    :aria-label="`Remove ${tag}`"
                    @click="removeTag(tag)"
                  >
                    <Icon name="fa:times" size="10" />
                  </button>
                </span>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-line pt-4">
            <UiButton type="button" variant="ghost" @click="cancelEdit">Cancel</UiButton>
            <UiButton type="submit" variant="primary" :is-loading="isSaving">
              Update competency
            </UiButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
