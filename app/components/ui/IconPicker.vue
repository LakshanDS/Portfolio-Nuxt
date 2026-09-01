<script setup lang="ts">
// Icons render via <Icon> + toIconName; metadata comes from the shared list.
import { iconMetadata, iconCategories } from "~/utils/iconMetadata";

const model = defineModel<string>({ default: "" });
const props = defineProps<{ label?: string }>();

const isOpen = ref(false);
const searchQuery = ref("");
const selectedCategory = ref("All");

const filteredIcons = computed(() =>
  iconMetadata.filter((icon) => {
    const matchesSearch =
      searchQuery.value === "" ||
      icon.displayName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      icon.name.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesCategory =
      selectedCategory.value === "All" || icon.category === selectedCategory.value;

    return matchesSearch && matchesCategory;
  }),
);

function categoryCount(category: string) {
  return iconMetadata.filter((icon) => icon.category === category).length;
}

// Render the grid in pages — mounting all ~1.5k <Icon> tiles at once is slow.
const PAGE_SIZE = 120;
const visibleCount = ref(PAGE_SIZE);
const gridBottom = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const visibleIcons = computed(() => filteredIcons.value.slice(0, visibleCount.value));

watch([searchQuery, selectedCategory], () => {
  visibleCount.value = PAGE_SIZE;
});

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting) && visibleCount.value < filteredIcons.value.length) {
      visibleCount.value += PAGE_SIZE;
    }
  });
});
watch(gridBottom, (el, prev) => {
  if (prev) observer?.unobserve(prev);
  if (el) observer?.observe(el);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div class="relative">
    <label v-if="props.label" class="mb-1 block text-xs font-medium text-[#d4d4ce]">
      {{ props.label }}
    </label>
    <button
      type="button"
      class="flex w-full items-center justify-between border border-[#2e2e32] bg-[#232326]/50 px-3 py-2 text-sm text-[#f5f5f0] transition-all hover:bg-[#232326] focus:border-[#4ADE80] focus:outline-none"
      @click="isOpen = !isOpen"
    >
      <div class="flex items-center gap-2">
        <!-- FaCode fallback when no icon matches -->
        <Icon
          v-if="model"
          :name="toIconName(model)"
          class="text-[#4ADE80]"
        />
        <span :class="model ? '' : 'text-[#d4d4ce]'">
          {{ model || "Select an icon..." }}
        </span>
      </div>
      <Icon name="fa:search" class="text-[#d4d4ce]" size="12" />
    </button>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div class="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden border border-[#232326] bg-gradient-to-br from-[#141416] to-[#141416] shadow-2xl">
        <div class="border-b border-[#232326] p-6">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-bold text-[#f5f5f0]">
              Select an Icon
            </h3>
            <button
              type="button"
              class="text-[#d4d4ce] transition-colors hover:text-[#f5f5f0]"
              aria-label="Close icon picker"
              @click="isOpen = false"
            >
              <Icon name="fa:times" size="20" />
            </button>
          </div>
          <div class="relative">
            <Icon name="fa:search" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#d4d4ce]" size="14" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search icons..."
              class="w-full border border-[#2e2e32] bg-[#232326]/50 py-2 pl-10 pr-4 text-sm text-[#f5f5f0] placeholder-[#d4d4ce] focus:border-[#4ADE80] focus:outline-none"
              autofocus
            >
          </div>
        </div>
        <div class="overflow-x-auto border-b border-[#232326] px-6 py-3">
          <div class="flex gap-2">
            <button
              type="button"
              class="whitespace-nowrap px-3 py-1.5 text-xs font-medium transition-all"
              :class="selectedCategory === 'All' ? 'bg-[#4ADE80] text-[#0a0a0b]' : 'bg-[#232326]/50 text-[#d4d4ce] hover:bg-[#232326] hover:text-[#f5f5f0]'"
              @click="selectedCategory = 'All'"
            >
              All ({{ iconMetadata.length }})
            </button>
            <button
              v-for="category in iconCategories"
              :key="category"
              type="button"
              class="whitespace-nowrap px-3 py-1.5 text-xs font-medium transition-all"
              :class="selectedCategory === category ? 'bg-[#4ADE80] text-[#0a0a0b]' : 'bg-[#232326]/50 text-[#d4d4ce] hover:bg-[#232326] hover:text-[#f5f5f0]'"
              @click="selectedCategory = category"
            >
              {{ category }} ({{ categoryCount(category) }})
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="filteredIcons.length === 0" class="py-12 text-center">
            <Icon name="fa:search" class="mx-auto mb-3 text-[#2e2e32]" size="32" />
            <p class="text-sm text-[#d4d4ce]">No icons found</p>
            <p class="mt-1 text-xs text-[#75756c]">
              Try a different search term or category
            </p>
          </div>
          <div v-else class="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            <button
              v-for="icon in visibleIcons"
              :key="icon.name"
              type="button"
              class="group relative border p-3 transition-all duration-200"
              :class="model === icon.name
                ? 'bg-[#4ADE80]/10 border-[#4ADE80] text-[#4ADE80]'
                : 'bg-[#232326]/30 border-[#232326] text-[#d4d4ce] hover:bg-[#232326] hover:border-[#2e2e32] hover:text-[#f5f5f0]'"
              :title="icon.displayName"
              @click="model = icon.name; isOpen = false"
            >
              <Icon :name="toIconName(icon.name)" class="mx-auto h-6 w-6" />
              <div class="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap border border-[#232326] bg-[#0a0a0b] px-2 py-1 text-xs text-[#f5f5f0] opacity-0 transition-opacity group-hover:opacity-100">
                {{ icon.displayName }}
              </div>
            </button>
          </div>
          <!-- Load more on scroll -->
          <div ref="gridBottom" />
        </div>
        <div class="border-t border-[#232326] bg-[#141416]/50 p-4">
          <div class="flex items-center justify-between text-xs text-[#d4d4ce]">
            <span>
              {{ filteredIcons.length }} icon{{ filteredIcons.length !== 1 ? "s" : "" }}
              {{ searchQuery || selectedCategory !== "All" ? "found" : "available" }}
            </span>
            <button
              v-if="model"
              type="button"
              class="text-red-400 transition-colors hover:text-red-300"
              @click="model = ''; isOpen = false"
            >
              Clear selection
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
