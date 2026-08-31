<script setup lang="ts">
// Portal → Teleport
const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ close: [] }>();

function lockBody(open: boolean) {
  document.body.style.overflow = open ? "hidden" : "unset";
}

watch(
  () => props.isOpen,
  (open) => {
    if (import.meta.client) lockBody(open);
  },
  { immediate: true },
);

onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = "unset";
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.isOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-200 animate-in fade-in md:p-8"
      @click="emit('close')"
    >
      <div class="absolute right-4 top-4 z-[101]">
        <!-- Button variant="secondary" size="sm" + className, merged -->
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 p-0 font-mono text-xs font-medium text-white transition-all hover:bg-black"
          @click="emit('close')"
        >
          <Icon name="fa:times" size="18px" />
        </button>
      </div>

      <div
        class="relative flex h-auto max-h-full w-auto max-w-full items-center justify-center overflow-auto rounded-lg shadow-2xl"
        @click.stop
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>
