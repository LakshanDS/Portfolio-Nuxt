<script setup lang="ts">
// `to`/`href`
// render NuxtLink/<a> for convenience)
const props = withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "outline" | "ghost" | "gradient";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    disabled?: boolean;
    to?: string;
    href?: string;
  }>(),
  { variant: "primary", size: "md" },
);

const variants: Record<string, string> = {
  primary:
    "border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10",
  secondary:
    "bg-[#141416] hover:bg-[#2e2e32] text-[#f5f5f0] border border-[#232326] hover:border-[#2e2e32]",
  outline:
    "bg-transparent border border-[#232326] hover:bg-[#141416] hover:border-[var(--color-primary)]/50 text-[#d4d4ce] hover:text-[#f5f5f0]",
  ghost: "bg-transparent hover:bg-[#141416] text-[#d4d4ce] hover:text-[#f5f5f0]",
  gradient:
    "bg-gradient-to-br from-[#4ADE80]/20 to-[#4ADE80]/5 border border-[#4ADE80]/30 hover:from-[#4ADE80]/30 hover:to-[#4ADE80]/10 text-[#4ADE80]",
};

const sizes: Record<string, string> = {
  sm: "text-xs py-1.5 px-3",
  md: "text-sm py-2.5 px-5",
  lg: "text-base py-2.5 px-5",
};

const tag = computed(() =>
  props.to ? resolveComponent("NuxtLink") : props.href ? "a" : "button",
);
</script>

<template>
  <component
    :is="tag"
    :to="props.to"
    :href="props.href"
    :disabled="props.isLoading || props.disabled"
    class="inline-flex items-center justify-center gap-2 font-mono font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600/20 disabled:border-gray-600/30 disabled:text-gray-500 disabled:hover:bg-gray-600/20 disabled:hover:border-gray-600/30"
    :class="[variants[props.variant], sizes[props.size]]"
  >
    <template v-if="props.isLoading">
      <svg
        class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      Loading...
    </template>
    <template v-else>
      <slot />
    </template>
  </component>
</template>
