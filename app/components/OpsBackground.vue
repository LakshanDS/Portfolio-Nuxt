<script setup lang="ts">
// Hidden on the admin dashboard, which keeps its own chrome.
const route = useRoute();
</script>

<template>
  <div v-if="!route.path.startsWith('/jasladmin')" class="ops-grid" aria-hidden="true" />
</template>
