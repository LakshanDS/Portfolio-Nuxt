<script setup lang="ts">
// Renders the
// global useToast() list; mount once (jasladmin-dashboard layout does).
const { toasts, remove } = useToast();
</script>

<template>
  <div class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
    <TransitionGroup
      enter-active-class="transition duration-300 ease-[cubic-bezier(0.22,1.2,0.36,1)]"
      enter-from-class="translate-y-[50px] opacity-0"
      leave-active-class="transition duration-300 ease-out"
      leave-to-class="translate-y-[50px] opacity-0"
    >
      <UiToast
        v-for="toast in toasts"
        :key="toast.id"
        :message="toast.message"
        :type="toast.type"
        :duration="toast.duration"
        @close="remove(toast.id)"
      />
    </TransitionGroup>
  </div>
</template>
