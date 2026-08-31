<script setup lang="ts">
// Skill
// categories + skills CRUD via /api/skills/manage (GET/POST/PUT/DELETE).
definePageMeta({ layout: "jasladmin-dashboard" });

interface SkillCategory {
  id: string;
  name: string;
  icon: string;
  displayOrder: number;
}

interface Skill {
  id: string;
  categoryId: string;
  name: string;
  icon: string | null;
  iconColor: string | null;
  displayOrder: number;
}

interface SkillGroup {
  category: SkillCategory;
  skills: Skill[];
}

type Editor =
  | { kind: "category"; mode: "new" | "edit"; id?: string }
  | { kind: "skill"; mode: "new" | "edit"; id?: string; categoryId: string }
  | null;

const toast = useToast();

const groups = ref<SkillGroup[]>([]);
const isLoading = ref(true);
const loadError = ref(false);

const editor = ref<Editor>(null);
const isSaving = ref(false);
const categoryForm = ref({ name: "", icon: "", displayOrder: 0 });
const skillForm = ref({ name: "", icon: "", iconColor: "", displayOrder: 0, categoryId: "" });

const pendingDelete = ref<{ type: "skill" | "category"; id: string; name: string } | null>(null);
const isDeleting = ref(false);

const inputCls =
  "w-full border border-line bg-transparent px-3 py-2 text-sm text-bright focus:border-phosphor focus:outline-none";
const labelCls = "mb-1 block font-mono text-[11px] uppercase tracking-[0.14em] text-dim";

const emptyCategoryForm = () => ({ name: "", icon: "", displayOrder: 0 });
const emptySkillForm = (categoryId = "") => ({
  name: "",
  icon: "",
  iconColor: "",
  displayOrder: 0,
  categoryId,
});

const editorCategoryName = computed(() => {
  if (editor.value?.kind !== "skill") return "";
  return groups.value.find((g) => g.category.id === skillForm.value.categoryId)?.category.name ?? "";
});

async function loadData() {
  isLoading.value = true;
  loadError.value = false;
  try {
    groups.value = await $fetch<SkillGroup[]>("/api/skills/manage");
  } catch (error) {
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
}
onMounted(loadData);

function openAddCategory() {
  categoryForm.value = emptyCategoryForm();
  editor.value = { kind: "category", mode: "new" };
}

function openEditCategory(category: SkillCategory) {
  categoryForm.value = {
    name: category.name,
    icon: category.icon || "",
    displayOrder: category.displayOrder ?? 0,
  };
  editor.value = { kind: "category", mode: "edit", id: category.id };
}

function openAddSkill(categoryId: string) {
  skillForm.value = emptySkillForm(categoryId);
  editor.value = { kind: "skill", mode: "new", categoryId };
}

function openEditSkill(skill: Skill) {
  skillForm.value = {
    name: skill.name,
    icon: skill.icon || "",
    iconColor: skill.iconColor || "",
    displayOrder: skill.displayOrder ?? 0,
    categoryId: skill.categoryId,
  };
  editor.value = { kind: "skill", mode: "edit", id: skill.id, categoryId: skill.categoryId };
}

function cancelEditor() {
  editor.value = null;
  categoryForm.value = emptyCategoryForm();
  skillForm.value = emptySkillForm();
}

// PUT when editing (with id), POST when new; on error keep the
// editor open, surface error.error, and refresh the list when the row is gone.
async function saveCategory() {
  if (editor.value?.kind !== "category") return;
  const isEdit = editor.value.mode === "edit";
  isSaving.value = true;
  try {
    await $fetch("/api/skills/manage", {
      method: isEdit ? "PUT" : "POST",
      body: {
        type: "category",
        ...(isEdit ? { id: editor.value.id } : {}),
        ...categoryForm.value,
      },
    });
    toast.success(isEdit ? "Category updated" : "Category created");
    cancelEditor();
    await loadData();
  } catch (error: unknown) {
    const err = error as { data?: { error?: string }; statusCode?: number; status?: number };
    toast.error(err?.data?.error || "Failed to save category");
    if ((err?.statusCode ?? err?.status) === 404) await loadData();
  } finally {
    isSaving.value = false;
  }
}

async function saveSkill() {
  if (editor.value?.kind !== "skill") return;
  const isEdit = editor.value.mode === "edit";
  isSaving.value = true;
  try {
    await $fetch("/api/skills/manage", {
      method: isEdit ? "PUT" : "POST",
      body: {
        type: "skill",
        ...(isEdit ? { id: editor.value.id } : {}),
        ...skillForm.value,
      },
    });
    toast.success(isEdit ? "Skill updated" : "Skill created");
    cancelEditor();
    await loadData();
  } catch (error: unknown) {
    const err = error as { data?: { error?: string }; statusCode?: number; status?: number };
    toast.error(err?.data?.error || "Failed to save skill");
    if ((err?.statusCode ?? err?.status) === 404) await loadData();
  } finally {
    isSaving.value = false;
  }
}

function askDeleteSkill(skill: Skill) {
  pendingDelete.value = { type: "skill", id: skill.id, name: skill.name };
}

function askDeleteCategory(category: SkillCategory) {
  pendingDelete.value = { type: "category", id: category.id, name: category.name };
}

async function confirmDelete() {
  if (!pendingDelete.value) return;
  const { type, id } = pendingDelete.value;
  isDeleting.value = true;
  try {
    await $fetch("/api/skills/manage", { method: "DELETE", query: { id, type } });
    toast.success(type === "skill" ? "Skill deleted" : "Category deleted");
    pendingDelete.value = null;
    await loadData();
  } catch (error) {
    toast.error("Failed to delete");
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
          <span class="text-phosphor">// </span>skills
        </h1>
        <p class="mt-1 text-sm text-dim">Manage your technical skills</p>
      </div>
      <UiButton variant="primary" size="sm" @click="openAddCategory">
        <Icon name="fa:plus" size="12" /> Add category
      </UiButton>
    </header>

    <div v-if="isLoading" class="animate-pulse font-mono text-sm text-dim">loading…</div>

    <div v-else-if="loadError" class="border border-amber/40 bg-amber/10 p-4 text-sm text-amber">
      failed to load skills —
      <UiButton variant="outline" size="sm" class="ml-2" @click="loadData">retry</UiButton>
    </div>

    <template v-else>
      <UiCard class="p-5">
        <div
          v-if="groups.length === 0"
          class="border border-dashed border-[#2e2e32] bg-panel/20 px-6 py-12 text-center"
        >
          <Icon name="fa:code" size="32" class="mx-auto mb-3 text-[#2e2e32]" />
          <p class="mb-3 text-sm text-dim">No skill categories yet</p>
          <UiButton variant="primary" size="sm" @click="openAddCategory">
            <Icon name="fa:plus" size="12" class="mr-1" /> Add first category
          </UiButton>
        </div>

        <div v-else>
          <div
            v-for="group in groups"
            :key="group.category.id"
            class="border-t border-line py-4 transition-colors first:border-t-0 first:pt-0 hover:bg-panel/70"
          >
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="flex items-center gap-3">
                <span
                  class="flex h-9 w-9 items-center justify-center border border-phosphor/30 bg-phosphor/10 text-phosphor"
                >
                  <Icon :name="toIconName(group.category.icon)" size="16" />
                </span>
                <h3 class="text-sm font-semibold text-bright">{{ group.category.name }}</h3>
                <UiBadge variant="primary">{{ group.skills.length }} skills</UiBadge>
                <span class="hidden font-mono text-[12px] text-dim md:inline">
                  order {{ group.category.displayOrder }}
                </span>
              </div>
              <div class="flex items-center gap-1">
                <UiButton variant="outline" size="sm" @click="openAddSkill(group.category.id)">
                  <Icon name="fa:plus" size="12" /> Add skill
                </UiButton>
                <UiButton
                  variant="ghost"
                  size="sm"
                  aria-label="Edit category"
                  @click="openEditCategory(group.category)"
                >
                  <Icon name="fa-solid:pen" size="12" />
                </UiButton>
                <UiButton
                  variant="ghost"
                  size="sm"
                  class="text-[#F87171] hover:bg-red-500/10 hover:text-[#ef4444]"
                  aria-label="Delete category"
                  @click="askDeleteCategory(group.category)"
                >
                  <Icon name="fa:trash" size="12" />
                </UiButton>
              </div>
            </div>

            <div
              v-if="group.skills.length > 0"
              class="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6"
            >
              <div
                v-for="skill in group.skills"
                :key="skill.id"
                class="group flex items-center gap-2 border border-line bg-panel px-3 py-2 transition-colors hover:border-phosphor/40"
              >
                <Icon
                  v-if="skill.icon"
                  :name="toIconName(skill.icon)"
                  size="14"
                  :style="skill.iconColor ? { color: skill.iconColor } : undefined"
                />
                <span class="flex-1 truncate text-sm text-bright">{{ skill.name }}</span>
                <span class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    class="rounded p-1 text-dim transition-colors hover:bg-phosphor/10 hover:text-phosphor"
                    aria-label="Edit skill"
                    @click="openEditSkill(skill)"
                  >
                    <Icon name="fa-solid:pen" size="10" />
                  </button>
                  <button
                    type="button"
                    class="rounded p-1 text-dim transition-colors hover:text-[#ef4444]"
                    aria-label="Delete skill"
                    @click="askDeleteSkill(skill)"
                  >
                    <Icon name="fa:times" size="10" />
                  </button>
                </span>
              </div>
            </div>
            <p v-else class="py-6 text-center text-sm text-dim">No skills added yet</p>
          </div>
        </div>
      </UiCard>

    </template>

    <!-- skill/category editor modal -->
    <div
      v-if="editor"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      @click.self="cancelEditor"
    >
      <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-line bg-panel">
        <div class="flex items-center justify-between border-b border-line p-5">
          <h3 class="font-mono text-sm uppercase tracking-[0.14em] text-bright">
            {{ editor.mode === "edit" ? "edit" : "new" }} {{ editor.kind }}
          </h3>
          <button
            type="button"
            class="p-1.5 text-dim transition-colors hover:bg-phosphor/10 hover:text-phosphor"
            aria-label="Close editor"
            @click="cancelEditor"
          >
            <Icon name="fa:times" size="14" />
          </button>
        </div>

        <form
          class="space-y-4 p-5"
          @submit.prevent="editor.kind === 'category' ? saveCategory() : saveSkill()"
        >
          <template v-if="editor.kind === 'category'">
            <div>
              <label for="category-name" :class="labelCls">Name</label>
              <input id="category-name" v-model="categoryForm.name" type="text" :class="inputCls" required>
            </div>
            <UiIconPicker v-model="categoryForm.icon" label="Icon" />
            <div class="w-32">
              <label for="category-order" :class="labelCls">Display order</label>
              <input id="category-order" v-model.number="categoryForm.displayOrder" type="number" :class="inputCls">
            </div>
          </template>

          <template v-else>
            <div>
              <span :class="labelCls">Category</span>
              <p class="border border-line bg-panel/60 px-3 py-2 font-mono text-[12px] text-dim">
                {{ editorCategoryName || "—" }}
              </p>
            </div>
            <div>
              <label for="skill-name" :class="labelCls">Name</label>
              <input id="skill-name" v-model="skillForm.name" type="text" :class="inputCls" required>
            </div>
            <UiIconPicker v-model="skillForm.icon" label="Icon (optional)" />
            <div>
              <label for="skill-color" :class="labelCls">Icon color</label>
              <div class="flex items-center gap-3">
                <input
                  id="skill-color"
                  type="color"
                  :value="skillForm.iconColor || '#4ade80'"
                  class="h-9 w-14 border border-line bg-transparent p-1"
                  @input="skillForm.iconColor = ($event.target as HTMLInputElement).value"
                >
                <span class="font-mono text-[12px] text-dim">{{ skillForm.iconColor || "default" }}</span>
                <button
                  v-if="skillForm.iconColor"
                  type="button"
                  class="font-mono text-[11px] uppercase tracking-[0.14em] text-dim transition-colors hover:text-amber"
                  @click="skillForm.iconColor = ''"
                >
                  clear
                </button>
              </div>
            </div>
            <div class="w-32">
              <label for="skill-order" :class="labelCls">Display order</label>
              <input id="skill-order" v-model.number="skillForm.displayOrder" type="number" :class="inputCls">
            </div>
          </template>

          <div class="flex justify-end gap-2 border-t border-line pt-4">
            <UiButton type="button" variant="ghost" size="sm" @click="cancelEditor">Cancel</UiButton>
            <UiButton type="submit" variant="primary" size="sm" :is-loading="isSaving">
              <Icon name="fa:save" size="12" />
              {{ editor.mode === "edit" ? "Update" : "Create" }}
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
        <p class="font-medium text-bright">
          delete {{ pendingDelete.type }} "{{ pendingDelete.name }}"?
        </p>
        <p class="mt-0.5 text-dim">
          this cannot be undone.<template v-if="pendingDelete.type === 'category'"> its skills will be removed too.</template>
        </p>
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
