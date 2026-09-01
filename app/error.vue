<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();
useSeoMeta({ title: () => `${props.error.statusCode} — lost signal` });
</script>

<template>
  <div class="mx-auto flex min-h-[70vh] max-w-[1200px] flex-col items-start justify-center px-[36px] max-md:px-6">
    <div class="font-mono text-[12px] uppercase tracking-[0.22em] text-amber">// connection lost</div>
    <h1 class="mt-6 text-[clamp(3rem,9vw,6rem)] font-bold text-bright">
      {{ error.statusCode }}
    </h1>
    <p class="mt-3 font-mono text-[13.5px] text-dim">
      $ {{ error.statusCode === 404 ? "route not found in registry" : error.statusMessage || "unhandled fault" }}
    </p>
    <button
      class="mt-8 border border-phosphor px-[22px] py-3 font-mono text-[13.5px] text-phosphor transition-colors hover:bg-phosphor/10"
      @click="clearError({ redirect: '/' })"
    >
      $ reboot --home
    </button>
  </div>
</template>
