<script setup lang="ts">
// Education
// CRUD via /api/education/manage (GET/POST/PUT/DELETE ?id=).
definePageMeta({ layout: "jasladmin-dashboard" });

interface EducationItem {
  id: string;
  institution: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  displayOrder: number;
}

const toast = useToast();

const education = ref<EducationItem[]>([]);
const isLoading = ref(true);
const loadError = ref(false);

const isEditing = ref<string | null>(null);
const isAdding = ref(false);
const isSaving = ref(false);
const pendingDelete = ref<{ id: string; label: string } | null>(null);
const isDeleting = ref(false);

const emptyForm = () => ({
  institution: "",
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  displayOrder: 0,
});
const form = ref(emptyForm());

const inputCls =
  "w-full border border-line bg-transparent px-3 py-2 text-sm text-bright focus:border-phosphor focus:outline-none";
const labelCls = "mb-1 block font-mono text-[11px] uppercase tracking-[0.14em] text-dim";

const editorOpen = computed(() => isAdding.value || isEditing.value !== null);

async function loadEducation() {
  isLoading.value = true;
  loadError.value = false;
  try {
    education.value = await $fetch<EducationItem[]>("/api/education/manage");
  } catch (error) {
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
}
onMounted(loadEducation);

function openAdd() {
  form.value = emptyForm();
  isAdding.value = true;
  isEditing.value = null;
}

function openEdit(item: EducationItem) {
  form.value = {
    institution: item.institution,
    title: item.title,
    description: item.description,
    startDate: item.startDate,
    endDate: item.endDate,
    displayOrder: item.displayOrder ?? 0,
  };
  isEditing.value = item.id;
  isAdding.value = false;
}

function handleCancel() {
  isEditing.value = null;
  isAdding.value = false;
  form.value = emptyForm();
}

async function handleSubmit() {
  isSaving.value = true;
  try {
    if (isAdding.value) {
      await $fetch("/api/education/manage", { method: "POST", body: form.value });
    } else if (isEditing.value) {
      await $fetch("/api/education/manage", {
        method: "PUT",
        body: { id: isEditing.value, ...form.value },
      });
    }
    toast.success(isAdding.value ? "Education created" : "Education updated");
    handleCancel();
    await loadEducation();
  } catch (error: unknown) {
    const err = error as { data?: { error?: string } };
    toast.error(err?.data?.error || "Failed to save education");
  } finally {
    isSaving.value = false;
  }
}

function askDelete(item: EducationItem) {
  pendingDelete.value = { id: item.id, label: `${item.title} — ${item.institution}` };
}

async function confirmDelete() {
  if (!pendingDelete.value) return;
  isDeleting.value = true;
  try {
    await $fetch("/api/education/manage", {
      method: "DELETE",
      query: { id: pendingDelete.value.id },
    });
    toast.success("Education deleted");
    pendingDelete.value = null;
    await loadEducation();
  } catch (error) {
    toast.error("Failed to delete education");
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
          <span class="text-phosphor">// </span>education
        </h1>
        <p class="mt-1 text-sm text-dim">Manage your educational qualifications</p>
      </div>
      <UiButton variant="primary" size="sm" @click="openAdd">
        <Icon name="fa:plus" size="12" /> Add entry
      </UiButton>
    </header>

    <div v-if="isLoading" class="animate-pulse font-mono text-sm text-dim">loading…</div>

    <div v-else-if="loadError" class="border border-amber/40 bg-amber/10 p-4 text-sm text-amber">
      failed to load education —
      <UiButton variant="outline" size="sm" class="ml-2" @click="loadEducation">retry</UiButton>
    </div>

    <template v-else>
      <UiCard class="p-5">
        <div
          v-if="education.length === 0"
          class="border border-dashed border-[#2e2e32] bg-panel/20 px-6 py-12 text-center"
        >
          <Icon name="fa:graduation-cap" size="32" class="mx-auto mb-3 text-[#2e2e32]" />
          <p class="mb-3 text-sm text-dim">No education entries yet</p>
          <UiButton variant="primary" size="sm" @click="openAdd">
            <Icon name="fa:plus" size="12" class="mr-1" /> Add first entry
          </UiButton>
        </div>

        <div v-else>
          <div
            v-for="edu in education"
            :key="edu.id"
            class="flex flex-col gap-2 border-t border-line px-3 py-4 transition-colors first:border-t-0 first:pt-0 hover:bg-panel/70"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-bright">{{ edu.title }}</h3>
                <p class="text-xs font-medium text-phosphor">{{ edu.institution }}</p>
                <p class="mt-1 font-mono text-[12px] text-dim">
                  {{ edu.startDate }} — {{ edu.endDate }} · order {{ edu.displayOrder }}
                </p>
              </div>
              <div class="flex shrink-0 gap-1">
                <UiButton
                  variant="ghost"
                  size="sm"
                  aria-label="Edit entry"
                  @click="openEdit(edu)"
                >
                  <Icon name="fa-solid:pen" size="11" />
                </UiButton>
                <UiButton
                  variant="ghost"
                  size="sm"
                  class="text-[#F87171] hover:bg-red-500/10 hover:text-[#ef4444]"
                  aria-label="Delete entry"
                  @click="askDelete(edu)"
                >
                  <Icon name="fa:trash" size="12" />
                </UiButton>
              </div>
            </div>
            <p class="line-clamp-2 text-xs leading-relaxed text-dim">{{ edu.description }}</p>
          </div>
        </div>
      </UiCard>

    </template>

    <!-- education editor modal -->
    <div
      v-if="editorOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      @click.self="handleCancel"
    >
      <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-line bg-panel">
        <div class="flex items-center justify-between border-b border-line p-5">
          <h3 class="font-mono text-sm uppercase tracking-[0.14em] text-bright">
            {{ isEditing ? "edit education" : "new education" }}
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
              <label for="edu-institution" :class="labelCls">Institution</label>
              <input
                id="edu-institution"
                v-model="form.institution"
                type="text"
                :class="inputCls"
                required
              >
            </div>
            <div>
              <label for="edu-title" :class="labelCls">Title / qualification</label>
              <input id="edu-title" v-model="form.title" type="text" :class="inputCls" required>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label for="edu-start" :class="labelCls">Start date</label>
              <input
                id="edu-start"
                v-model="form.startDate"
                type="text"
                :class="inputCls"
                placeholder="e.g. 2018"
                required
              >
            </div>
            <div>
              <label for="edu-end" :class="labelCls">End date</label>
              <input
                id="edu-end"
                v-model="form.endDate"
                type="text"
                :class="inputCls"
                placeholder="e.g. 2022"
                required
              >
            </div>
          </div>

          <div>
            <label for="edu-description" :class="labelCls">Description</label>
            <textarea
              id="edu-description"
              v-model="form.description"
              :class="inputCls"
              class="min-h-[100px] resize-none"
              required
            />
          </div>

          <div class="w-32">
            <label for="edu-order" :class="labelCls">Display order</label>
            <input id="edu-order" v-model.number="form.displayOrder" type="number" :class="inputCls">
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
