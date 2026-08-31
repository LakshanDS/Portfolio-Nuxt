<script setup lang="ts">
// Homepage
// settings: hero content (profile image upload, title, description, CTA
// buttons) + section toggles. Section titles/subtitles are
// not editable because the NightOps homepage hardcodes its headers and only
// reads each section's `enabled` flag.
// Saves via POST /api/home-settings.
definePageMeta({ layout: "jasladmin-dashboard" });

interface HomeSettings {
  hero: {
    title: string;
    description: string;
    primaryButtonText: string;
    primaryButtonLink: string;
    secondaryButtonText: string;
    secondaryButtonLink: string;
    imageUrl: string;
  };
  sections: Record<string, { enabled: boolean }>;
  featured: {
    projectId: string;
    kicker: string;
    statusLine: string;
    sub: string;
    logo: string;
    beats: { label: string; text: string }[];
  };
  strip: {
    projectId: string;
    kicker: string;
    stats: { value: string; label: string }[];
  };
}

// structural empty state — real defaults live in server/api/home-settings.get.ts
const emptySettings = (): HomeSettings => ({
  hero: {
    title: "",
    description: "",
    primaryButtonText: "",
    primaryButtonLink: "",
    secondaryButtonText: "",
    secondaryButtonLink: "",
    imageUrl: "",
  },
  sections: {},
  featured: { projectId: "", kicker: "", statusLine: "", sub: "", logo: "", beats: [] },
  strip: { projectId: "", kicker: "", stats: [] },
});

const toast = useToast();
const settings = ref<HomeSettings>(emptySettings());
const isLoading = ref(true);
const loadError = ref(false);
const hasChanges = ref(false);
const saving = ref(false);
const imagePreview = ref("");
const logoPreview = ref("");
const uploading = ref(""); // which upload is in flight: "hero" | "featured"
const showResetConfirm = ref(false);
const projectOptions = ref<{ id: string; title: string }[]>([]);

async function loadSettings() {
  isLoading.value = true;
  loadError.value = false;
  try {
    // the API always returns complete settings (server defaults merged in)
    const data = await $fetch<HomeSettings>("/api/home-settings");
    settings.value = {
      ...emptySettings(),
      ...data,
      hero: { ...emptySettings().hero, ...data.hero },
      featured: { ...emptySettings().featured, ...data.featured },
      strip: { ...emptySettings().strip, ...data.strip },
    };
    imagePreview.value = settings.value.hero.imageUrl;
    logoPreview.value = settings.value.featured.logo;
  } catch (error) {
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  loadSettings();
  try {
    projectOptions.value = await $fetch<{ id: string; title: string }[]>("/api/projects");
  } catch {
    // picker stays empty; the rest of the page still works
  }
});

function updateHero(field: keyof HomeSettings["hero"], value: string) {
  settings.value = {
    ...settings.value,
    hero: { ...settings.value.hero, [field]: value },
  };
  hasChanges.value = true;
}

function updateFeatured<K extends keyof HomeSettings["featured"]>(
  field: K,
  value: HomeSettings["featured"][K],
) {
  settings.value = {
    ...settings.value,
    featured: { ...settings.value.featured, [field]: value },
  };
  hasChanges.value = true;
}

function updateStrip<K extends keyof HomeSettings["strip"]>(
  field: K,
  value: HomeSettings["strip"][K],
) {
  settings.value = {
    ...settings.value,
    strip: { ...settings.value.strip, [field]: value },
  };
  hasChanges.value = true;
}

function updateBeat(index: number, field: "label" | "text", value: string) {
  updateFeatured(
    "beats",
    settings.value.featured.beats.map((beat, i) => (i === index ? { ...beat, [field]: value } : beat)),
  );
}

function updateStat(index: number, field: "value" | "label", value: string) {
  updateStrip(
    "stats",
    settings.value.strip.stats.map((stat, i) => (i === index ? { ...stat, [field]: value } : stat)),
  );
}

function toggleSection(key: string) {
  settings.value = {
    ...settings.value,
    sections: {
      ...settings.value.sections,
      [key]: { enabled: !settings.value.sections[key]?.enabled },
    },
  };
  hasChanges.value = true;
}

async function cleanupUpload(path?: string) {
  if (!path?.startsWith("/uploads/")) return;
  try {
    await $fetch("/api/delete-file", { method: "POST", body: { filePath: path } });
  } catch {
    // stale image cleanup is best-effort
  }
}

// POST /api/upload (FormData: file + prefix), then apply the stored path
async function uploadImage(e: Event, prefix: string, apply: (filePath: string) => void) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = prefix;

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("prefix", prefix);

    const result = await $fetch<{ success?: boolean; filePath?: string; error?: string }>(
      "/api/upload",
      { method: "POST", body: formData },
    );

    if (result.success && result.filePath) {
      apply(result.filePath);
      toast.success("Image uploaded");
    } else {
      toast.error(`Upload failed: ${result.error ?? "unknown error"}`);
    }
  } catch (error) {
    toast.error("Failed to upload image");
  } finally {
    uploading.value = "";
    (e.target as HTMLInputElement).value = "";
  }
}

function handleHeroUpload(e: Event) {
  uploadImage(e, "hero", (filePath) => {
    const oldPath = settings.value.hero.imageUrl;
    updateHero("imageUrl", filePath);
    imagePreview.value = filePath;
    void cleanupUpload(oldPath);
  });
}

function handleLogoUpload(e: Event) {
  uploadImage(e, "featured", (filePath) => {
    const oldPath = settings.value.featured.logo;
    updateFeatured("logo", filePath);
    logoPreview.value = filePath;
    void cleanupUpload(oldPath);
  });
}

async function saveSettings() {
  saving.value = true;
  try {
    await $fetch("/api/home-settings", { method: "POST", body: settings.value });
    hasChanges.value = false;
    toast.success("Settings saved successfully!");
  } catch (error) {
    toast.error("Failed to save settings");
  } finally {
    saving.value = false;
  }
}

async function resetSettings() {
  settings.value = await $fetch<HomeSettings>("/api/home-settings", { query: { defaults: 1 } });
  imagePreview.value = settings.value.hero.imageUrl;
  logoPreview.value = settings.value.featured.logo;
  hasChanges.value = true;
  showResetConfirm.value = false;
}

// homepage sections in render order (see app/pages/index.vue)
const sectionRows: { key: string; title: string; subtitle: string }[] = [
  { key: "toolsOfTrade", title: "Tools", subtitle: "tools of trade strip" },
  { key: "projects", title: "Featured Work", subtitle: "project grid" },
  { key: "roadmap", title: "Career Log", subtitle: "roadmap timeline" },
  { key: "competencies", title: "Expertise", subtitle: "core competencies" },
  { key: "cta", title: "Contact", subtitle: "closing call-to-action" },
];

const heroFields: { key: keyof HomeSettings["hero"]; label: string; placeholder?: string; hint?: string }[] = [
  {
    key: "title",
    label: "title",
    placeholder: "Hi, I'm Lakshan.",
    hint: "wrap \\\\text\\\\ for dim gray",
  },
  {
    key: "description",
    label: "description",
    hint: "use ||text|| for green highlight",
  },
];

const buttonFields: { key: "primaryButtonText" | "secondaryButtonText"; linkKey: "primaryButtonLink" | "secondaryButtonLink"; label: string }[] = [
  { key: "primaryButtonText", linkKey: "primaryButtonLink", label: "primary button" },
  { key: "secondaryButtonText", linkKey: "secondaryButtonLink", label: "secondary button" },
];

const featuredFields: { key: "kicker" | "statusLine" | "sub"; label: string; placeholder?: string }[] = [
  { key: "kicker", label: "kicker", placeholder: "agentmello" },
  { key: "statusLine", label: "status line", placeholder: "in production · 24/7" },
  { key: "sub", label: "tagline", placeholder: "falls back to the project description" },
];

const inputCls =
  "w-full border border-line bg-transparent px-3 py-2 text-sm text-bright focus:border-phosphor focus:outline-none";
const labelCls = "font-mono text-[11px] uppercase tracking-[0.14em] text-dim";
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-medium text-bright">
          <span class="text-phosphor">// </span>homepage
        </h1>
        <p class="text-sm text-dim">configure homepage content and sections</p>
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

    <div v-if="isLoading" class="animate-pulse font-mono text-sm text-dim">loading…</div>

    <div v-else-if="loadError" class="border border-amber bg-amber/5 p-4">
      <p class="font-mono text-sm text-amber">failed to load settings</p>
      <UiButton variant="outline" size="sm" class="mt-3" @click="loadSettings">retry</UiButton>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <!-- HERO CONTENT -->
        <UiCard>
          <div class="border-b border-line p-5">
            <h2 class="font-mono text-sm uppercase tracking-[0.14em] text-dim">hero content</h2>
            <p class="mt-0.5 text-xs text-dim">configure the main hero section</p>
          </div>

          <div class="space-y-4 p-5">
            <div class="flex items-center gap-4 border border-line p-4">
              <label
                class="group relative h-20 w-20 cursor-pointer overflow-hidden border border-line bg-abyss"
              >
                <img
                  v-if="imagePreview"
                  :src="imagePreview"
                  alt="Hero Preview"
                  class="h-full w-full object-cover"
                />
                <div v-else class="flex h-full w-full items-center justify-center text-dim">
                  <Icon name="fa:image" size="22" />
                </div>
                <span
                  class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Icon name="fa:upload" size="14" class="text-bright" />
                  <span class="mt-1 font-mono text-[10px] uppercase text-bright">
                    {{ uploading === "hero" ? "uploading…" : "change" }}
                  </span>
                </span>
                <input type="file" accept="image/*" class="hidden" @change="handleHeroUpload" />
              </label>
              <div>
                <h3 class="text-sm text-bright">hero image</h3>
                <p class="mt-0.5 text-xs text-dim">hover and click to change the portrait</p>
              </div>
            </div>

            <div v-for="field in heroFields" :key="field.key">
              <label :class="labelCls" class="mb-1 block">{{ field.label }}</label>
              <textarea
                v-if="field.key === 'description'"
                :value="settings.hero.description"
                :class="inputCls"
                class="min-h-[80px] resize-none"
                placeholder="Enter hero description"
                @input="updateHero('description', ($event.target as HTMLTextAreaElement).value)"
              />
              <input
                v-else
                type="text"
                :value="settings.hero[field.key]"
                :class="inputCls"
                :placeholder="field.placeholder"
                @input="updateHero(field.key, ($event.target as HTMLInputElement).value)"
              />
              <p v-if="field.hint" class="mt-1 font-mono text-[10px] text-dim">{{ field.hint }}</p>
            </div>

            <div class="space-y-3 border-t border-line pt-4">
              <label :class="labelCls" class="block">call to action buttons</label>
              <div v-for="btn in buttonFields" :key="btn.key" class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block font-mono text-[10px] text-dim">{{ btn.label }} text</label>
                  <input
                    type="text"
                    :value="settings.hero[btn.key]"
                    :class="inputCls"
                    @input="updateHero(btn.key, ($event.target as HTMLInputElement).value)"
                  />
                </div>
                <div>
                  <label class="mb-1 block font-mono text-[10px] text-dim">{{ btn.label }} link</label>
                  <input
                    type="text"
                    :value="settings.hero[btn.linkKey]"
                    :class="inputCls"
                    @input="updateHero(btn.linkKey, ($event.target as HTMLInputElement).value)"
                  />
                </div>
              </div>
            </div>
          </div>
        </UiCard>

        <!-- SECTION SETTINGS -->
        <UiCard>
          <div class="border-b border-line p-5">
            <h2 class="font-mono text-sm uppercase tracking-[0.14em] text-dim">section settings</h2>
            <p class="mt-0.5 text-xs text-dim">toggle sections on/off</p>
          </div>

          <div>
            <div
              v-for="row in sectionRows"
              :key="row.key"
              class="flex items-center gap-3 border-t border-line px-5 py-3 hover:bg-panel/70"
            >
              <button
                class="flex h-8 w-8 shrink-0 items-center justify-center transition-colors"
                :class="
                  settings.sections[row.key]?.enabled
                    ? 'bg-phosphor/20 text-phosphor hover:bg-phosphor/30'
                    : 'bg-dim/20 text-dim hover:bg-dim/30'
                "
                :aria-label="`Toggle ${row.title}`"
                @click="toggleSection(row.key)"
              >
                <Icon
                  :name="settings.sections[row.key]?.enabled ? 'fa:toggle-on' : 'fa:toggle-off'"
                  size="16"
                />
              </button>
              <div class="min-w-0 flex-1">
                <p
                  class="text-sm"
                  :class="settings.sections[row.key]?.enabled ? 'text-bright' : 'text-dim'"
                >
                  {{ row.title }}
                </p>
                <p class="font-mono text-[12px] text-dim">{{ row.subtitle }}</p>
              </div>
            </div>
          </div>
        </UiCard>
      </div>

      <!-- FEATURED PROJECT -->
      <UiCard class="mt-5">
        <div class="border-b border-line p-5">
          <h2 class="font-mono text-sm uppercase tracking-[0.14em] text-dim">featured project</h2>
          <p class="mt-0.5 text-xs text-dim">
            flagship frame + strip under it — set a slot to none to hide it
          </p>
        </div>

        <div class="grid grid-cols-1 gap-8 p-5 lg:grid-cols-2">
          <!-- flagship -->
          <div class="space-y-4">
            <div>
              <label :class="labelCls" class="mb-1 block">flagship project</label>
              <select
                :value="settings.featured.projectId"
                :class="inputCls"
                @change="updateFeatured('projectId', ($event.target as HTMLSelectElement).value)"
              >
                <option value="">(none — hide section)</option>
                <option v-for="p in projectOptions" :key="p.id" :value="p.id">{{ p.title }}</option>
              </select>
            </div>

            <template v-if="settings.featured.projectId">
              <div class="flex items-center gap-4 border border-line p-4">
                <label
                  class="group relative h-20 w-20 cursor-pointer overflow-hidden border border-line bg-abyss"
                >
                  <img
                    v-if="logoPreview"
                    :src="logoPreview"
                    alt="Featured logo preview"
                    class="h-full w-full object-contain p-1"
                  />
                  <div v-else class="flex h-full w-full items-center justify-center text-dim">
                    <Icon name="fa:image" size="22" />
                  </div>
                  <span
                    class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Icon name="fa:upload" size="14" class="text-bright" />
                    <span class="mt-1 font-mono text-[10px] uppercase text-bright">
                      {{ uploading === "featured" ? "uploading…" : "change" }}
                    </span>
                  </span>
                  <input type="file" accept="image/*" class="hidden" @change="handleLogoUpload" />
                </label>
                <div>
                  <h3 class="text-sm text-bright">flagship logo</h3>
                  <p class="mt-0.5 text-xs text-dim">
                    wide logo for the frame — falls back to the project image
                  </p>
                </div>
              </div>

              <div v-for="field in featuredFields" :key="field.key">
                <label :class="labelCls" class="mb-1 block">{{ field.label }}</label>
                <input
                  type="text"
                  :value="settings.featured[field.key]"
                  :class="inputCls"
                  :placeholder="field.placeholder"
                  @input="updateFeatured(field.key, ($event.target as HTMLInputElement).value)"
                />
              </div>

              <div class="border-t border-line pt-4">
                <label :class="labelCls" class="mb-2 block">beats</label>
                <div class="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                  <div v-for="(beat, i) in settings.featured.beats" :key="i" class="space-y-2">
                    <input
                      type="text"
                      :value="beat.label"
                      :class="inputCls"
                      placeholder="label"
                      @input="updateBeat(i, 'label', ($event.target as HTMLInputElement).value)"
                    />
                    <textarea
                      :value="beat.text"
                      :class="inputCls"
                      class="min-h-[90px] resize-none"
                      placeholder="text — empty beats are hidden"
                      @input="updateBeat(i, 'text', ($event.target as HTMLTextAreaElement).value)"
                    />
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- strip -->
          <div class="space-y-4">
            <div>
              <label :class="labelCls" class="mb-1 block">strip project</label>
              <select
                :value="settings.strip.projectId"
                :class="inputCls"
                @change="updateStrip('projectId', ($event.target as HTMLSelectElement).value)"
              >
                <option value="">(none — hide strip)</option>
                <option v-for="p in projectOptions" :key="p.id" :value="p.id">{{ p.title }}</option>
              </select>
            </div>

            <template v-if="settings.strip.projectId">
              <div>
                <label :class="labelCls" class="mb-1 block">strip kicker</label>
                <input
                  type="text"
                  :value="settings.strip.kicker"
                  :class="inputCls"
                  placeholder="falls back to the project category"
                  @input="updateStrip('kicker', ($event.target as HTMLInputElement).value)"
                />
              </div>

              <div class="border-t border-line pt-4">
                <label :class="labelCls" class="mb-2 block">strip stats</label>
                <div class="grid grid-cols-2 gap-3">
                  <div v-for="(stat, i) in settings.strip.stats" :key="i" class="space-y-2">
                    <input
                      type="text"
                      :value="stat.value"
                      :class="inputCls"
                      placeholder="value (253+)"
                      @input="updateStat(i, 'value', ($event.target as HTMLInputElement).value)"
                    />
                    <input
                      type="text"
                      :value="stat.label"
                      :class="inputCls"
                      placeholder="label (real trades)"
                      @input="updateStat(i, 'label', ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </UiCard>
    </template>

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
  </div>
</template>
