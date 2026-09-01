<script setup lang="ts">
// about-page settings in one place: hero (profile image upload, terminal bio,
// name/title/bio) and about cards.
// Saves via POST /api/about-settings; profile via PUT /api/profile/manage;
// cards via /api/about-cards CRUD.
definePageMeta({ layout: "jasladmin-dashboard" });

interface AboutSettings {
  hero: {
    profileImage: string;
    terminalBio: string[];
  };
}

interface PersonalInfo {
  name: string;
  title: string;
  bio: string;
  dateOfBirth: string;
  gender: string;
  address: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  whatsapp: string;
}

interface AboutCard {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  content: string;
  displayOrder: number;
}

// structural empty state — real defaults live in server/api/about-settings.get.ts
const emptySettings = (): AboutSettings => ({ hero: { profileImage: "", terminalBio: [] } });

const emptyCardForm = () => ({
  title: "",
  icon: "",
  iconColor: "#4ADE80",
  content: "",
  displayOrder: 0,
});

const toast = useToast();

// SSR-fetch settings + profile + cards in parallel — data arrives with the
// HTML, no post-hydration loading state
const [{ data: settingsData, error: settingsError, refresh: refreshSettings },
       { data: manageData, error: manageError, refresh: refreshManage },
       { data: cardsData, error: cardsError, refresh: refreshCards }] = await Promise.all([
  useFetch<AboutSettings | null>("/api/about-settings"),
  useFetch<{ profile: Record<string, string> | null; stats: Record<string, unknown> | null }>("/api/profile/manage"),
  useFetch<AboutCard[]>("/api/about-cards"),
]);

// the API merges server defaults, so a response with `hero` is complete;
// error payloads carry no hero → empty state. Old rows carry a dropped
// letsConnect blob (contact info now lives only in the profile) — strip it
// so it doesn't get re-saved
const saved = settingsData.value && "hero" in settingsData.value ? settingsData.value : null;
const settings = ref<AboutSettings>(saved ?? emptySettings());
if (saved) delete (settings.value as Record<string, unknown>).letsConnect;
const loadError = computed(() => Boolean(settingsError.value || manageError.value || cardsError.value));
const hasChanges = ref(false);
const saving = ref(false);
const terminalInput = ref((settings.value.hero.terminalBio ?? []).join("\n"));
const imagePreview = ref(settings.value.hero.profileImage ?? "");
const uploadingImage = ref(false);
const showResetConfirm = ref(false);

// merged from about-me: profile + cards
const aboutCards = computed(() => cardsData.value ?? []);
// profile defaults come from /api/profile/manage (server-side defaultProfile)
const p = manageData.value?.profile;
const personalInfo = ref<PersonalInfo>({
  name: p?.name || "",
  title: p?.title || "",
  bio: p?.bio || "",
  dateOfBirth: p?.dateOfBirth || "",
  gender: p?.gender || "",
  address: p?.address || "",
});
const contactInfo = ref<ContactInfo>({
  email: p?.email || "",
  phone: p?.phone || "",
  linkedin: p?.linkedinUrl || "",
  github: p?.githubUrl || "",
  whatsapp: p?.whatsappUrl || "",
});

const editingSection = ref<"contact" | null>(null);
const editData = ref<Record<string, string>>({});
const savingSection = ref(false);

// the /about numbers line — ProfileStats singleton; resumeDownloads is
// auto-counted on resume downloads, so display-only here
const statsForm = ref({
  pipelinesFixed: String(manageData.value?.stats?.pipelinesFixed ?? "0"),
  projectsCount: Number(manageData.value?.stats?.projectsCount ?? 0),
  selfCommits: Number(manageData.value?.stats?.selfCommits ?? 0),
  experience: String(manageData.value?.stats?.experience ?? "0"),
});
const resumeDownloads = computed(() => Number(manageData.value?.stats?.resumeDownloads ?? 0));

const isAddingCard = ref(false);
const editingCardId = ref<string | null>(null);
const cardForm = ref(emptyCardForm());
const savingCard = ref(false);
const deleteCardTarget = ref<AboutCard | null>(null);
const deletingCard = ref(false);

async function retryLoad() {
  await Promise.all([refreshSettings(), refreshManage(), refreshCards()]);
}

function updateSettings(updates: Partial<AboutSettings>) {
  settings.value = { ...settings.value, ...updates };
  hasChanges.value = true;
}

function updateHero(field: string, value: string) {
  settings.value = {
    ...settings.value,
    hero: { ...settings.value.hero, [field]: value },
  };
  hasChanges.value = true;
}

function handleTerminalInput(value: string) {
  terminalInput.value = value;
  updateSettings({
    hero: {
      ...settings.value.hero,
      terminalBio: value.split("\n").filter((line) => line.trim()),
    },
  });
}

async function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploadingImage.value = true;

  try {
    // POST /api/upload (FormData: file + prefix='profile')
    const formData = new FormData();
    formData.append("file", file);
    formData.append("prefix", "profile");

    const result = await $fetch<{ success?: boolean; filePath?: string; error?: string }>(
      "/api/upload",
      { method: "POST", body: formData },
    );

    if (result.success && result.filePath) {
      // delete the old image if it was an uploaded file
      if (settings.value.hero.profileImage?.startsWith("/uploads/")) {
        try {
          await $fetch("/api/delete-file", {
            method: "POST",
            body: { filePath: settings.value.hero.profileImage },
          });
        } catch {
          // stale image cleanup is best-effort
        }
      }
      imagePreview.value = result.filePath;
      updateHero("profileImage", result.filePath);
      toast.success("Profile image uploaded");
    } else {
      toast.error(`Upload failed: ${result.error ?? "unknown error"}`);
    }
  } catch (error) {
    toast.error("Failed to upload image");
  } finally {
    uploadingImage.value = false;
    (e.target as HTMLInputElement).value = "";
  }
}

async function saveSettings() {
  saving.value = true;
  try {
    // hero + personal cards edit Profile fields alongside page settings
    const [settingsRes, profileRes] = await Promise.allSettled([
      $fetch("/api/about-settings", { method: "POST", body: settings.value }),
      $fetch("/api/profile/manage", {
        method: "PUT",
        body: {
          profileId: "default",
          statsId: manageData.value?.stats?.id,
          statsData: { ...statsForm.value },
          profileData: {
            name: personalInfo.value.name,
            title: personalInfo.value.title,
            bio: personalInfo.value.bio,
            dateOfBirth: personalInfo.value.dateOfBirth,
            gender: personalInfo.value.gender,
            address: personalInfo.value.address,
          },
        },
      }),
    ]);
    if (settingsRes.status === "fulfilled" && profileRes.status === "fulfilled") {
      hasChanges.value = false;
      toast.success("Settings saved successfully!");
    } else {
      toast.error("Failed to save some settings");
    }
  } catch (error) {
    toast.error("Failed to save settings");
  } finally {
    saving.value = false;
  }
}

async function resetSettings() {
  settings.value = await $fetch<AboutSettings>("/api/about-settings", { query: { defaults: 1 } });
  terminalInput.value = settings.value.hero.terminalBio.join("\n");
  imagePreview.value = settings.value.hero.profileImage;
  hasChanges.value = true;
  showResetConfirm.value = false;
}

function startEdit() {
  editingSection.value = "contact";
  editData.value = { ...contactInfo.value };
}

function cancelEdit() {
  editingSection.value = null;
  editData.value = {};
}

async function saveSection() {
  savingSection.value = true;
  try {
    await $fetch("/api/profile/manage", {
      method: "PUT",
      body: {
        profileId: "default",
        profileData: {
          name: personalInfo.value.name,
          title: personalInfo.value.title,
          bio: personalInfo.value.bio,
          email: editData.value.email,
          phone: editData.value.phone,
          linkedinUrl: editData.value.linkedin,
          githubUrl: editData.value.github,
          whatsappUrl: editData.value.whatsapp,
        },
      },
    });
    contactInfo.value = editData.value as unknown as ContactInfo;
    cancelEdit();
    toast.success("Profile saved");
  } catch (error) {
    toast.error("Failed to save data");
  } finally {
    savingSection.value = false;
  }
}

function handleAddCard() {
  cardForm.value = { ...emptyCardForm(), displayOrder: aboutCards.value.length };
  isAddingCard.value = true;
  editingCardId.value = null;
}

function handleEditCard(card: AboutCard) {
  cardForm.value = {
    title: card.title,
    icon: card.icon,
    iconColor: card.iconColor,
    content: card.content,
    displayOrder: card.displayOrder,
  };
  editingCardId.value = card.id;
  isAddingCard.value = false;
}

function handleCardCancel() {
  isAddingCard.value = false;
  editingCardId.value = null;
  cardForm.value = emptyCardForm();
}

async function handleCardSubmit() {
  savingCard.value = true;
  try {
    if (isAddingCard.value) {
      await $fetch("/api/about-cards", { method: "POST", body: cardForm.value });
      toast.success("Card created");
    } else if (editingCardId.value) {
      await $fetch("/api/about-cards", {
        method: "PUT",
        body: { id: editingCardId.value, ...cardForm.value },
      });
      toast.success("Card updated");
    }
    handleCardCancel();
    await refreshCards();
  } catch (error) {
    toast.error("Failed to save card");
  } finally {
    savingCard.value = false;
  }
}

async function confirmDeleteCard() {
  if (!deleteCardTarget.value) return;
  deletingCard.value = true;
  try {
    await $fetch(`/api/about-cards?id=${deleteCardTarget.value.id}`, { method: "DELETE" });
    toast.success("Card deleted");
    deleteCardTarget.value = null;
    await refreshCards();
  } catch (error) {
    toast.error("Failed to delete card");
  } finally {
    deletingCard.value = false;
  }
}

const inputCls =
  "w-full border border-line bg-transparent px-3 py-2 text-sm text-bright focus:border-phosphor focus:outline-none";
const labelCls = "font-mono text-[11px] uppercase tracking-[0.14em] text-dim";
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-medium text-bright">
          <span class="text-phosphor">// </span>about-settings
        </h1>
        <p class="text-sm text-dim">configure about page content and sections</p>
      </div>
      <div class="flex gap-2">
        <UiButton variant="outline" size="sm" @click="showResetConfirm = true">
          <Icon name="fa:undo" size="12" /> reset
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          :is-loading="saving"
          :disabled="!hasChanges"
          @click="saveSettings"
        >
          <Icon name="fa:save" size="12" />
          {{ hasChanges ? "save changes" : "saved" }}
        </UiButton>
      </div>
    </div>

    <div v-if="loadError" class="border border-amber bg-amber/5 p-4">
      <p class="font-mono text-sm text-amber">failed to load settings</p>
      <UiButton variant="outline" size="sm" class="mt-3" @click="retryLoad">retry</UiButton>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <!-- HERO CONTENT -->
        <UiCard>
          <div class="border-b border-line p-5">
            <h2 class="font-mono text-sm uppercase tracking-[0.14em] text-dim">hero content</h2>
            <p class="mt-0.5 text-xs text-dim">configure hero section</p>
          </div>

          <div class="space-y-4 p-5">
            <div class="flex items-center gap-4 border border-line p-4">
              <label
                class="group relative h-20 w-20 cursor-pointer overflow-hidden border border-line bg-abyss"
              >
                <img
                  v-if="imagePreview"
                  :src="imagePreview"
                  alt="Profile Preview"
                  class="h-full w-full object-cover"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center text-dim"
                >
                  <Icon name="fa:image" size="22" />
                </div>
                <span
                  class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Icon name="fa:upload" size="14" class="text-bright" />
                  <span class="mt-1 font-mono text-[10px] uppercase text-bright">
                    {{ uploadingImage ? "uploading…" : "change" }}
                  </span>
                </span>
                <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
              </label>
              <div>
                <h3 class="text-sm text-bright">profile image</h3>
                <p class="mt-0.5 text-xs text-dim">hover and click to change your profile picture</p>
              </div>
            </div>

            <div class="flex items-start gap-3">              <div class="flex-1">
                <label :class="labelCls" class="mb-1 block">name</label>
                <input
                  v-model="personalInfo.name"
                  type="text"
                  :class="inputCls"
                  @input="hasChanges = true"
                />
              </div>
            </div>

            <div class="flex items-start gap-3">              <div class="flex-1">
                <label :class="labelCls" class="mb-1 block">job title</label>
                <input
                  v-model="personalInfo.title"
                  type="text"
                  :class="inputCls"
                  @input="hasChanges = true"
                />
              </div>
            </div>

            <div class="flex items-start gap-3">              <div class="flex-1">
                <label :class="labelCls" class="mb-1 block">terminal bio (one per line)</label>
                <textarea
                  :value="terminalInput"
                  :class="inputCls"
                  class="min-h-[140px] resize-none font-mono text-xs"
                  placeholder="$ whoami"
                  @input="handleTerminalInput(($event.target as HTMLTextAreaElement).value)"
                />
                <p class="mt-1 font-mono text-[10px] text-dim">
                  $ lines render gray (input) · &gt; lines render green (output)
                </p>
              </div>
            </div>
          </div>
        </UiCard>

        <!-- PERSONAL INFO (feeds the generated resume) -->
        <UiCard>
          <div class="border-b border-line p-5">
            <h2 class="font-mono text-sm uppercase tracking-[0.14em] text-dim">
              personal info
            </h2>
            <p class="mt-0.5 text-xs text-dim">renders into the generated resume</p>
          </div>

          <div class="space-y-4 p-5">
            <div class="flex items-start gap-3">              <div class="flex-1">
                <label :class="labelCls" class="mb-1 block">birthday</label>
                <input
                  v-model="personalInfo.dateOfBirth"
                  type="text"
                  :class="inputCls"
                  placeholder="2000/04/02"
                  @input="hasChanges = true"
                />
                <p class="mt-1 font-mono text-[10px] text-dim">age is computed from this</p>
              </div>
            </div>

            <div class="flex items-start gap-3">              <div class="flex-1">
                <label :class="labelCls" class="mb-1 block">gender</label>
                <select v-model="personalInfo.gender" :class="inputCls" @change="hasChanges = true">
                  <option value="" class="bg-panel text-bright">Not specified</option>
                  <option value="Male" class="bg-panel text-bright">Male</option>
                  <option value="Female" class="bg-panel text-bright">Female</option>
                  <option value="Other" class="bg-panel text-bright">Other</option>
                </select>
              </div>
            </div>

            <div class="flex items-start gap-3">              <div class="flex-1">
                <label :class="labelCls" class="mb-1 block">address</label>
                <textarea
                  v-model="personalInfo.address"
                  :class="inputCls"
                  class="min-h-[80px] resize-none"
                  @input="hasChanges = true"
                />
              </div>
            </div>

            <div class="flex items-start gap-3">              <div class="flex-1">
                <label :class="labelCls" class="mb-1 block">bio</label>
                <textarea
                  v-model="personalInfo.bio"
                  :class="inputCls"
                  class="min-h-[100px] resize-none"
                  placeholder="Brief professional bio for your resume and profile"
                  @input="hasChanges = true"
                />
              </div>
            </div>
          </div>
        </UiCard>
      </div>

      <!-- STATS READOUT (the numbers line under the about hero) -->
      <UiCard>
        <div class="border-b border-line p-5">
          <h2 class="font-mono text-sm uppercase tracking-[0.14em] text-dim">stats readout</h2>
          <p class="mt-0.5 text-xs text-dim">the numbers line under the about hero</p>
        </div>

        <div class="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <label :class="labelCls" class="mb-1 block">total projects</label>
            <input
              v-model="statsForm.pipelinesFixed"
              type="text"
              :class="inputCls"
              @input="hasChanges = true"
            />
          </div>
          <div>
            <label :class="labelCls" class="mb-1 block">projects shipped</label>
            <input
              v-model.number="statsForm.projectsCount"
              type="number"
              :class="inputCls"
              @input="hasChanges = true"
            />
          </div>
          <div>
            <label :class="labelCls" class="mb-1 block">commits pushed</label>
            <input
              v-model.number="statsForm.selfCommits"
              type="number"
              :class="inputCls"
              @input="hasChanges = true"
            />
          </div>
          <div>
            <label :class="labelCls" class="mb-1 block">yrs in service</label>
            <input
              v-model="statsForm.experience"
              type="text"
              :class="inputCls"
              @input="hasChanges = true"
            />
          </div>
          <div>
            <label :class="labelCls" class="mb-1 block">resume pulls</label>
            <p class="text-sm leading-[38px] text-bright">{{ resumeDownloads }}</p>
          </div>
        </div>
      </UiCard>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <!-- ABOUT CARDS -->
        <UiCard>
          <div class="flex items-center justify-between border-b border-line p-5">
            <div class="flex items-center gap-3">
              <div class="border border-phosphor/30 bg-phosphor/10 p-2 text-phosphor">
                <Icon name="fa-solid:palette" size="14" />
              </div>
              <div>
                <h2 class="font-mono text-sm uppercase tracking-[0.14em] text-dim">about cards</h2>
                <p class="mt-0.5 text-xs text-dim">cards displayed on the about page</p>
              </div>
            </div>
            <UiButton variant="outline" size="sm" @click="handleAddCard">
              <Icon name="fa:plus" size="12" /> add card
            </UiButton>
          </div>

          <div>
            <div
              v-if="aboutCards.length === 0 && !isAddingCard"
              class="m-5 border border-dashed border-line py-12 text-center"
            >
              <Icon name="fa-solid:palette" size="28" class="mx-auto mb-3 text-line" />
              <p class="mb-3 text-sm text-dim">no about cards yet</p>
              <UiButton variant="primary" size="sm" @click="handleAddCard">
                <Icon name="fa:plus" size="12" /> add first card
              </UiButton>
            </div>

            <div
              v-for="card in aboutCards"
              :key="card.id"
              class="flex cursor-pointer items-start justify-between gap-3 border-t border-line px-5 py-4 hover:bg-panel/70"
              :class="
                editingCardId === card.id
                  ? 'border-l-2 border-l-phosphor bg-panel/60'
                  : 'border-l-2 border-l-transparent'
              "
              @click="handleEditCard(card)"
            >
              <div class="flex min-w-0 items-start gap-3">
                <div
                  class="p-2"
                  :style="{ backgroundColor: `${card.iconColor}20`, color: card.iconColor }"
                >
                  <Icon :name="toIconName(card.icon)" size="16" />
                </div>
                <div class="min-w-0">
                  <h3 class="truncate text-sm font-medium text-bright">{{ card.title }}</h3>
                  <p class="mt-0.5 line-clamp-2 text-xs leading-relaxed text-dim">
                    {{ card.content }}
                  </p>
                  <p class="mt-1 font-mono text-[12px] text-dim">order {{ card.displayOrder }}</p>
                </div>
              </div>
              <div class="flex shrink-0 gap-1">
                <button
                  class="p-1.5 text-dim transition-colors hover:bg-phosphor/10 hover:text-phosphor"
                  aria-label="Edit card"
                  @click.stop="handleEditCard(card)"
                >
                  <Icon name="fa-solid:pen" size="11" />
                </button>
                <button
                  class="p-1.5 text-dim transition-colors hover:bg-red-500/10 hover:text-red-400"
                  aria-label="Delete card"
                  @click.stop="deleteCardTarget = card"
                >
                  <Icon name="fa:trash" size="12" />
                </button>
              </div>
            </div>
          </div>
        </UiCard>

        <!-- CONTACT INFO -->
        <UiCard>
          <div class="flex items-center justify-between border-b border-line p-5">
            <div>
              <h2 class="font-mono text-sm uppercase tracking-[0.14em] text-dim">contact</h2>
              <p class="mt-0.5 text-xs text-dim">your contact details</p>
            </div>
            <button
              class="p-1.5 text-phosphor transition-colors hover:bg-phosphor/10"
              aria-label="Edit contact info"
              @click="editingSection === 'contact' ? cancelEdit() : startEdit()"
            >
              <Icon name="fa-solid:pen" size="12" />
            </button>
          </div>

          <div v-if="editingSection === 'contact'" class="space-y-4 p-5">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label :class="labelCls" class="mb-1 block">email</label>
                <input v-model="editData.email" type="email" :class="inputCls" />
              </div>
              <div>
                <label :class="labelCls" class="mb-1 block">phone</label>
                <input v-model="editData.phone" type="text" :class="inputCls" />
              </div>
            </div>
            <div class="space-y-3 border-t border-line pt-4">
              <div>
                <label :class="labelCls" class="mb-1 block">linkedin</label>
                <input v-model="editData.linkedin" type="url" :class="inputCls" />
              </div>
              <div>
                <label :class="labelCls" class="mb-1 block">github</label>
                <input v-model="editData.github" type="url" :class="inputCls" />
              </div>
              <div>
                <label :class="labelCls" class="mb-1 block">whatsapp</label>
                <input v-model="editData.whatsapp" type="url" :class="inputCls" placeholder="https://wa.me/94..." />
              </div>
            </div>
            <div class="flex justify-end gap-2 border-t border-line pt-4">
              <UiButton variant="ghost" size="sm" @click="cancelEdit">Cancel</UiButton>
              <UiButton variant="primary" size="sm" :is-loading="savingSection" @click="saveSection">
                <Icon name="fa:save" size="12" /> Save
              </UiButton>
            </div>
          </div>

          <div v-else>
            <div
              v-for="row in [
                { label: 'email', value: contactInfo.email, icon: 'fa:envelope' },
                ...(contactInfo.phone
                  ? [{ label: 'phone', value: contactInfo.phone, icon: 'fa:phone' }]
                  : []),
              ]"
              :key="row.label"
              class="flex items-start gap-3 border-t border-line px-5 py-3 hover:bg-panel/70"
            >
              <Icon :name="row.icon" size="13" class="mt-1 shrink-0 text-dim" />
              <div class="flex-1">
                <p class="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                  {{ row.label }}
                </p>
                <p class="text-sm text-bright">{{ row.value }}</p>
              </div>
            </div>
            <div
              v-for="row in [
                { label: 'linkedin', value: contactInfo.linkedin, icon: 'fa:linkedin' },
                { label: 'github', value: contactInfo.github, icon: 'fa:github' },
                ...(contactInfo.whatsapp
                  ? [{ label: 'whatsapp', value: contactInfo.whatsapp, icon: 'fa:whatsapp' }]
                  : []),
              ]"
              :key="row.label"
              class="flex items-start gap-3 border-t border-line px-5 py-3 hover:bg-panel/70"
            >
              <Icon :name="row.icon" size="13" class="mt-1 shrink-0 text-dim" />
              <div class="flex-1">
                <p class="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                  {{ row.label }}
                </p>
                <a
                  :href="row.value"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="break-all text-sm text-phosphor hover:underline"
                >
                  {{ row.value }}
                </a>
              </div>
            </div>
          </div>
        </UiCard>
      </div>

    </template>

    <!-- card editor modal -->
    <div
      v-if="isAddingCard || editingCardId"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      @click.self="handleCardCancel"
    >
      <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-line bg-panel">
        <div class="flex items-center justify-between border-b border-line p-5">
          <h3 class="font-mono text-sm uppercase tracking-[0.14em] text-bright">
            {{ editingCardId ? "edit card" : "new card" }}
          </h3>
          <button
            class="p-1.5 text-dim transition-colors hover:bg-phosphor/10 hover:text-phosphor"
            aria-label="Close card editor"
            @click="handleCardCancel"
          >
            <Icon name="fa:times" size="14" />
          </button>
        </div>
        <form class="space-y-4 p-5" @submit.prevent="handleCardSubmit">
          <div>
            <label :class="labelCls" class="mb-1 block">title</label>
            <input v-model="cardForm.title" type="text" :class="inputCls" required />
          </div>
          <UiIconPicker v-model="cardForm.icon" label="icon" />
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label :class="labelCls" class="mb-1 block">icon color</label>
              <div class="flex items-center gap-2">
                <input
                  v-model="cardForm.iconColor"
                  type="color"
                  class="h-10 w-10 cursor-pointer border border-line bg-transparent"
                />
                <input v-model="cardForm.iconColor" type="text" :class="inputCls" />
              </div>
            </div>
            <div>
              <label :class="labelCls" class="mb-1 block">display order</label>
              <input
                v-model.number="cardForm.displayOrder"
                type="number"
                :class="inputCls"
                required
              />
            </div>
          </div>
          <div>
            <label :class="labelCls" class="mb-1 block">content</label>
            <textarea
              v-model="cardForm.content"
              :class="inputCls"
              class="min-h-[120px] resize-none"
              required
            />
          </div>
          <div class="flex justify-end gap-2 border-t border-line pt-4">
            <UiButton type="button" variant="ghost" size="sm" @click="handleCardCancel">
              Cancel
            </UiButton>
            <UiButton type="submit" variant="primary" size="sm" :is-loading="savingCard">
              <Icon name="fa:save" size="12" />
              {{ editingCardId ? "Update" : "Create" }}
            </UiButton>
          </div>
        </form>
      </div>
    </div>

    <!-- reset confirm -->
    <div
      v-if="showResetConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      @click.self="showResetConfirm = false"
    >
      <div class="w-full max-w-md border border-amber bg-panel">
        <div class="flex items-start gap-4 border-b border-line p-5">
          <div class="border border-amber/40 bg-amber/10 p-2.5 text-amber">
            <Icon name="fa:exclamation-triangle" size="18" />
          </div>
          <div>
            <h3 class="font-mono text-sm uppercase tracking-[0.14em] text-bright">reset settings</h3>
            <p class="mt-1 text-sm text-dim">
              restore default settings? current unsaved changes will be lost.
            </p>
          </div>
        </div>
        <div class="flex justify-end gap-2 p-5">
          <UiButton variant="ghost" size="sm" @click="showResetConfirm = false">Cancel</UiButton>
          <UiButton variant="primary" size="sm" @click="resetSettings">Reset</UiButton>
        </div>
      </div>
    </div>

    <!-- delete card confirm -->
    <div
      v-if="deleteCardTarget"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      @click.self="deleteCardTarget = null"
    >
      <div class="w-full max-w-md border border-amber bg-panel">
        <div class="flex items-start gap-4 border-b border-line p-5">
          <div class="border border-amber/40 bg-amber/10 p-2.5 text-amber">
            <Icon name="fa:exclamation-triangle" size="18" />
          </div>
          <div>
            <h3 class="font-mono text-sm uppercase tracking-[0.14em] text-bright">
              delete about card
            </h3>
            <p class="mt-1 text-sm text-dim">
              delete “{{ deleteCardTarget.title }}”? this action cannot be undone.
            </p>
          </div>
        </div>
        <div class="flex justify-end gap-2 p-5">
          <UiButton variant="ghost" size="sm" @click="deleteCardTarget = null">Cancel</UiButton>
          <UiButton
            variant="primary"
            size="sm"
            class="border-red-500/40 text-red-400 hover:bg-red-500/10"
            :is-loading="deletingCard"
            @click="confirmDeleteCard"
          >
            <Icon name="fa:trash" size="12" /> Delete
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>
