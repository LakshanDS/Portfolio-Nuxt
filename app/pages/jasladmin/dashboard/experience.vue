<script setup lang="ts">
// Experience
// CRUD via /api/experience/manage (GET/POST/PUT/DELETE ?id=).
definePageMeta({ layout: "jasladmin-dashboard" });

interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

const toast = useToast();

const experience = ref<ExperienceItem[]>([]);
const isLoading = ref(true);
const loadError = ref(false);

const isEditing = ref<string | null>(null);
const isAdding = ref(false);
const isSaving = ref(false);
const pendingDelete = ref<{ id: string; label: string } | null>(null);
const isDeleting = ref(false);

const emptyForm = () => ({
  company: "",
  position: "",
  description: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
});
const form = ref(emptyForm());

const inputCls =
  "w-full border border-line bg-transparent px-3 py-2 text-sm text-bright focus:border-phosphor focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";
const labelCls = "mb-1 block font-mono text-[11px] uppercase tracking-[0.14em] text-dim";

const editorOpen = computed(() => isAdding.value || isEditing.value !== null);

async function loadExperience() {
  isLoading.value = true;
  loadError.value = false;
  try {
    experience.value = await $fetch<ExperienceItem[]>("/api/experience/manage");
  } catch (error) {
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
}
onMounted(loadExperience);

function openAdd() {
  form.value = emptyForm();
  isAdding.value = true;
  isEditing.value = null;
}

function openEdit(item: ExperienceItem) {
  form.value = {
    company: item.company,
    position: item.position,
    description: item.description,
    startDate: item.startDate,
    endDate: item.endDate || "",
    isCurrent: item.isCurrent,
  };
  isEditing.value = item.id;
  isAdding.value = false;
}

function handleCancel() {
  isEditing.value = null;
  isAdding.value = false;
  form.value = emptyForm();
}

function setIsCurrent(checked: boolean) {
  // clear the end date when switching to current
  form.value = { ...form.value, isCurrent: checked, endDate: checked ? "" : form.value.endDate };
}

async function handleSubmit() {
  isSaving.value = true;
  try {
    if (isAdding.value) {
      await $fetch("/api/experience/manage", { method: "POST", body: form.value });
    } else if (isEditing.value) {
      await $fetch("/api/experience/manage", {
        method: "PUT",
        body: { id: isEditing.value, ...form.value },
      });
    }
    toast.success(isAdding.value ? "Experience created" : "Experience updated");
    handleCancel();
    await loadExperience();
  } catch (error: unknown) {
    const err = error as { data?: { error?: string } };
    toast.error(err?.data?.error || "Failed to save experience");
  } finally {
    isSaving.value = false;
  }
}

function askDelete(item: ExperienceItem) {
  pendingDelete.value = { id: item.id, label: `${item.position} — ${item.company}` };
}

async function confirmDelete() {
  if (!pendingDelete.value) return;
  isDeleting.value = true;
  try {
    await $fetch("/api/experience/manage", {
      method: "DELETE",
      query: { id: pendingDelete.value.id },
    });
    toast.success("Experience deleted");
    pendingDelete.value = null;
    await loadExperience();
  } catch (error) {
    toast.error("Failed to delete experience");
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div class="space-y-5">
    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-medium text-bright">
          <span class="text-phosphor">// </span>experience
        </h1>
        <p class="mt-1 text-sm text-dim">Manage your professional experience</p>
      </div>
      <UiButton variant="primary" size="sm" @click="openAdd">
        <Icon name="fa:plus" size="12" /> Add entry
      </UiButton>
    </header>

    <div v-if="isLoading" class="animate-pulse font-mono text-sm text-dim">loading…</div>

    <div v-else-if="loadError" class="border border-amber/40 bg-amber/10 p-4 text-sm text-amber">
      failed to load experience —
      <UiButton variant="outline" size="sm" class="ml-2" @click="loadExperience">retry</UiButton>
    </div>

    <template v-else>
      <UiCard class="p-5">
        <div
          v-if="experience.length === 0"
          class="border border-dashed border-[#2e2e32] bg-panel/20 px-6 py-12 text-center"
        >
          <Icon name="fa:briefcase" size="32" class="mx-auto mb-3 text-[#2e2e32]" />
          <p class="mb-3 text-sm text-dim">No experience entries yet</p>
          <UiButton variant="primary" size="sm" @click="openAdd">
            <Icon name="fa:plus" size="12" class="mr-1" /> Add first entry
          </UiButton>
        </div>

        <div v-else>
          <div
            v-for="exp in experience"
            :key="exp.id"
            class="flex flex-col gap-2 border-t border-line px-3 py-4 transition-colors first:border-t-0 first:pt-0 hover:bg-panel/70"
            :class="exp.isCurrent ? 'border-l-2 border-l-phosphor' : ''"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-sm font-semibold text-bright">{{ exp.position }}</h3>
                  <UiBadge v-if="exp.isCurrent" variant="primary">current</UiBadge>
                </div>
                <p class="text-xs font-medium text-phosphor">{{ exp.company }}</p>
                <p class="mt-1 font-mono text-[12px] text-dim">
                  {{ exp.startDate }} — {{ exp.isCurrent ? "present" : exp.endDate }}
                </p>
              </div>
              <div class="flex shrink-0 gap-1">
                <UiButton
                  variant="ghost"
                  size="sm"
                  aria-label="Edit entry"
                  @click="openEdit(exp)"
                >
                  <Icon name="fa-solid:pen" size="11" />
                </UiButton>
                <UiButton
                  variant="ghost"
                  size="sm"
                  class="text-[#F87171] hover:bg-red-500/10 hover:text-[#ef4444]"
                  aria-label="Delete entry"
                  @click="askDelete(exp)"
                >
                  <Icon name="fa:trash" size="12" />
                </UiButton>
              </div>
            </div>
            <p class="line-clamp-2 text-xs leading-relaxed text-dim">{{ exp.description }}</p>
          </div>
        </div>
      </UiCard>

    </template>

    <!-- experience editor modal -->
    <div
      v-if="editorOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      @click.self="handleCancel"
    >
      <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-line bg-panel">
        <div class="flex items-center justify-between border-b border-line p-5">
          <h3 class="font-mono text-sm uppercase tracking-[0.14em] text-bright">
            {{ isEditing ? "edit experience" : "new experience" }}
          </h3>
          <button
            type="button"
            class="p-1.5 text-dim transition-colors hover:bg-phosphor/10 hover:text-phosphor"
            aria-label="Close editor"
            @click="handleCancel"
          >
            <Icon name="fa:times" size="14" />
          </button>
        </div>

        <form class="space-y-4 p-5" @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label for="exp-company" :class="labelCls">Company</label>
              <input id="exp-company" v-model="form.company" type="text" :class="inputCls" required>
            </div>
            <div>
              <label for="exp-position" :class="labelCls">Position / title</label>
              <input id="exp-position" v-model="form.position" type="text" :class="inputCls" required>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label for="exp-start" :class="labelCls">Start date</label>
              <input
                id="exp-start"
                v-model="form.startDate"
                type="text"
                :class="inputCls"
                placeholder="e.g. Jan 2020"
                required
              >
            </div>
            <div>
              <label for="exp-end" :class="labelCls">End date</label>
              <input
                id="exp-end"
                v-model="form.endDate"
                type="text"
                :class="inputCls"
                placeholder="e.g. Dec 2022"
                :disabled="form.isCurrent"
              >
            </div>
          </div>

          <label class="flex items-center gap-3">
            <input
              type="checkbox"
              class="h-4 w-4 accent-[#4ADE80]"
              :checked="form.isCurrent"
              @change="setIsCurrent(($event.target as HTMLInputElement).checked)"
            >
            <span class="text-sm text-bright">Currently working here</span>
          </label>

          <div>
            <label for="exp-description" :class="labelCls">Description</label>
            <textarea
              id="exp-description"
              v-model="form.description"
              :class="inputCls"
              class="min-h-[100px] resize-none"
              required
            />
          </div>

          <div class="flex justify-end gap-2 border-t border-line pt-4">
            <UiButton type="button" variant="ghost" size="sm" @click="handleCancel">Cancel</UiButton>
            <UiButton type="submit" variant="primary" size="sm" :is-loading="isSaving">
              <Icon name="fa:save" size="12" />
              {{ isEditing ? "Update" : "Create" }}
            </UiButton>
          </div>
        </form>
      </div>
    </div>

    <!-- amber delete confirmation -->
    <div
      v-if="pendingDelete"
      class="fixed inset-x-0 bottom-6 z-50 mx-auto flex w-[calc(100%-2rem)] max-w-lg items-start gap-3 border border-amber/40 bg-panel p-4 shadow-2xl"
    >
      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center border border-amber/40 bg-amber/10 text-amber"
      >
        <Icon name="fa:exclamation-triangle" size="14" />
      </span>
      <div class="flex-1 text-sm">
        <p class="font-medium text-bright">delete entry "{{ pendingDelete.label }}"?</p>
        <p class="mt-0.5 text-dim">this cannot be undone.</p>
      </div>
      <div class="flex gap-2">
        <UiButton variant="ghost" size="sm" @click="pendingDelete = null">Cancel</UiButton>
        <UiButton
          variant="primary"
          size="sm"
          class="border-amber/50 text-amber hover:bg-amber/10"
          :is-loading="isDeleting"
          @click="confirmDelete"
        >
          Delete
        </UiButton>
      </div>
    </div>
  </div>
</template>
