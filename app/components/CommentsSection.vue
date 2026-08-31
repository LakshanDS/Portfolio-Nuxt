<script setup lang="ts">
// The toast UI is inlined here as plain classes.
type ToastType = "success" | "error" | "info";
type ToastItem = { id: string; message: string; type: ToastType };

const props = defineProps<{ projectId: string }>();

const submitting = ref(false);
const toasts = ref<ToastItem[]>([]);
const formData = reactive({ name: "", email: "", content: "" });

const toastColors: Record<ToastType, string> = {
  success: "border-[#4ADE80] bg-[#4ADE80]/10 text-[#4ADE80]",
  error: "border-red-500 bg-red-500/10 text-red-500",
  info: "border-emerald-500 bg-emerald-500/10 text-emerald-500",
};
const toastIcons: Record<ToastType, string> = {
  success: "fa:check",
  error: "fa:times",
  info: "fa:times",
};

function addToast(message: string, type: ToastType = "success") {
  const id = Date.now().toString();
  toasts.value = [...toasts.value, { id, message, type }];
  setTimeout(() => removeToast(id), 5000);
}

function removeToast(id: string) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

async function handleSubmit() {
  if (!formData.content.trim()) {
    addToast("Please enter a comment", "error");
    return;
  }

  submitting.value = true;

  try {
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: props.projectId,
        name: formData.name || undefined,
        email: formData.email || undefined,
        content: formData.content,
      }),
    });

    if (response.ok) {
      Object.assign(formData, { name: "", email: "", content: "" });
      addToast("Thank you for your comment!", "success");
    } else {
      addToast("Failed to submit comment. Please try again.", "error");
    }
  } catch (error) {
    addToast("Failed to submit comment. Please try again.", "error");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <!-- inline toast UI -->
    <div class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item fixed bottom-6 left-1/2 z-50 flex min-w-[300px] max-w-md items-center gap-3 rounded-lg border px-6 py-4 shadow-2xl"
          :class="toastColors[toast.type]"
        >
          <div class="shrink-0">
            <Icon :name="toastIcons[toast.type]" class="text-sm" />
          </div>
          <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
          <button
            type="button"
            class="shrink-0 opacity-60 transition-opacity hover:opacity-100"
            @click="removeToast(toast.id)"
          >
            <Icon name="fa:times" class="text-sm" />
          </button>
        </div>
      </TransitionGroup>
    </div>

    <div class="mt-16 max-w-[74ch] border-t border-line pt-[26px]">
      <!-- Header -->
      <div class="mb-[18px] flex items-baseline justify-between">
        <h2 class="text-[1.15rem] font-medium text-bright">
          <span class="font-mono text-phosphor">// </span>field notes
        </h2>
        <span class="font-mono text-[11px] text-dim">notes are public</span>
      </div>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr]">
          <!-- Left Column - Name & Email -->
          <div class="space-y-4">
            <div>
              <label for="fn-name" class="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                name <span class="normal-case opacity-70">(optional)</span>
              </label>
              <input
                id="fn-name"
                v-model="formData.name"
                type="text"
                placeholder="your name"
                class="w-full border border-line bg-panel px-3 py-2.5 font-mono text-[13px] text-bright placeholder-dim transition-colors focus:border-phosphor focus:outline-none"
              />
            </div>
            <div>
              <label for="fn-email" class="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                email <span class="normal-case opacity-70">(optional)</span>
              </label>
              <input
                id="fn-email"
                v-model="formData.email"
                type="email"
                placeholder="you@domain.dev"
                class="w-full border border-line bg-panel px-3 py-2.5 font-mono text-[13px] text-bright placeholder-dim transition-colors focus:border-phosphor focus:outline-none"
              />
            </div>
          </div>

          <!-- Right Column - Comment -->
          <div class="flex flex-col">
            <label for="fn-content" class="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
              note <span class="text-phosphor">*</span>
            </label>
            <textarea
              id="fn-content"
              v-model="formData.content"
              placeholder="leave a note about this system…"
              rows="4"
              required
              class="w-full flex-1 resize-none border border-line bg-panel px-3 py-2.5 font-mono text-[13px] leading-[1.7] text-bright placeholder-dim transition-colors focus:border-phosphor focus:outline-none"
            />
          </div>
        </div>

        <!-- Submit -->
        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="submitting"
            class="border border-phosphor/55 px-4 py-[9px] font-mono text-[12px] text-phosphor transition-colors hover:bg-phosphor/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ submitting ? "posting…" : "submit note ⏎" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* toast motion — opacity/y spring + 300ms fade-out */
.toast-item {
  transform: translate(-50%, 0);
}
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s cubic-bezier(0.22, 1.2, 0.36, 1);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 50px);
}
</style>
