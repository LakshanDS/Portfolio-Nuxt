<script setup lang="ts">
// Fires POST /api/track-visit on every route change.
const route = useRoute();

async function trackVisit() {
  try {
    const response = await fetch("/api/track-visit", {
      method: "POST",
      body: JSON.stringify({ path: route.path }),
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch {
    // best-effort tracking — never surface anything client-side
  }
}

onMounted(trackVisit);
watch(() => route.fullPath, trackVisit);
</script>

<!-- real element: Nuxt's client-only wrapper crashes on a null render
     (empty/comment-only templates return null in prod builds) -->
<template><span hidden aria-hidden="true" /></template>
