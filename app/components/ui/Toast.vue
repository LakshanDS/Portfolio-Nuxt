<script setup lang="ts">
// Self-timing item;
// fades out after `duration` ms, emits close 300ms into the fade.
// Usually rendered via <UiToasts/> + useToast().
import type { ToastType } from "~/composables/useToast";

const props = withDefaults(
  defineProps<{
    message: string;
    type?: ToastType;
    duration?: number;
  }>(),
  { type: "success", duration: 5000 },
);
const emit = defineEmits<{ close: [] }>();

const isVisible = ref(true);
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  hideTimer = setTimeout(handleClose, props.duration);
});

onUnmounted(() => {
  clearTimeout(hideTimer);
  clearTimeout(closeTimer);
});

function handleClose() {
  if (!isVisible.value) return;
  isVisible.value = false;
  closeTimer = setTimeout(() => emit("close"), 300);
}

const colors: Record<ToastType, string> = {
  success: "border-[#4ADE80] bg-[#4ADE80]/10 text-[#4ADE80]",
  error: "border-red-500 bg-red-500/10 text-red-500",
  info: "border-emerald-500 bg-emerald-500/10 text-emerald-500",
};

const icons: Record<ToastType, string> = {
  success: "fa:check",
  error: "fa:times",
  info: "fa:times",
};
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-[cubic-bezier(0.22,1.2,0.36,1)]"
    enter-from-class="translate-y-[50px] opacity-0"
    leave-active-class="transition duration-300 ease-out"
    leave-to-class="translate-y-[50px] opacity-0"
  >
    <div
      v-if="isVisible"
      class="fixed bottom-6 left-1/2 z-50 flex min-w-[300px] max-w-md -translate-x-1/2 items-center gap-3 rounded-lg border px-6 py-4 shadow-2xl"
      :class="colors[props.type]"
    >
      <div class="shrink-0">
        <Icon :name="icons[props.type]" class="text-sm" />
      </div>
      <p class="flex-1 text-sm font-medium">{{ props.message }}</p>
      <button
        type="button"
        class="shrink-0 opacity-60 transition-opacity hover:opacity-100"
        @click="handleClose"
      >
        <Icon name="fa:times" class="text-sm" />
      </button>
    </div>
  </Transition>
</template>
