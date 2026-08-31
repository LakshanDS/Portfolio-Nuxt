<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?:
      | "default"
      | "primary"
      | "success"
      | "warning"
      | "error"
      | "outline"
      | "secondary"
      | "ghost";
  }>(),
  { variant: "default" },
);

const variants: Record<string, string> = {
  default: "bg-[#141416] border border-[#232326] text-[#d4d4ce]",
  primary: "bg-[#4ADE80]/10 border border-[#4ADE80]/30 text-[#4ADE80]",
  success: "bg-[#4ADE80]/10 border border-[#4ADE80]/30 text-[#4ADE80]",
  warning: "bg-[#ffb454]/10 border border-[#ffb454]/30 text-[#ffb454]",
  error: "bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444]",
  outline: "border border-[#2e2e32] text-[#d4d4ce] bg-transparent",
  secondary: "bg-[#2e2e32]/20 border border-[#2e2e32]/30 text-[#f5f5f0]",
  ghost: "bg-transparent border-none text-[#d4d4ce] hover:bg-[#232326]/50",
};
</script>

<template>
  <div
    class="inline-flex items-center px-3 py-1 font-mono text-xs font-medium transition-colors"
    :class="variants[props.variant]"
  >
    <slot />
  </div>
</template>
