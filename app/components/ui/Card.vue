<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: "default" | "glass" | "gradient";
  }>(),
  { variant: "default" },
);

const variants: Record<string, string> = {
  default: "bg-[#141416] border border-[#232326] shadow-none",
  glass: "bg-[#141416]/60 backdrop-blur-lg border border-[#232326] shadow-none",
  gradient:
    "bg-gradient-to-br from-[#141416]/80 to-[#141416]/80 border border-[#232326] shadow-none",
};
</script>

<template>
  <div :class="variants[props.variant]">
    <slot />
  </div>
</template>
