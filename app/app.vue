<script setup lang="ts">
type SeoProfile = {
  name?: string;
  title?: string;
  bio?: string;
  profileImage?: string;
} | null;

const defaultTitle = "Lakshan De Silva | DevOps & Cloud Engineer";
const defaultDescription =
  "DevOps Engineer & Cloud Architect focused on reliable infrastructure, automation, and scalable systems.";

// profile-driven root metadata.
// Awaited so the SSR render already carries the resolved title/description.
const { data: profile } = await useAsyncData<SeoProfile>("seo-profile", async () => {
  try {
    return (await $fetch<{ profile: SeoProfile }>("/api/profile")).profile ?? null;
  } catch {
    return null; // DB errors must not break metadata — fall back to defaults
  }
});

// NUXT_PUBLIC_SITE_URL overrides in prod
const baseUrl = String(useRuntimeConfig().public.siteURL).trim().replace(/\/$/, "");
const title = computed(() => (profile.value ? `${profile.value.name} | ${profile.value.title}` : defaultTitle));
const description = computed(() => profile.value?.bio ?? defaultDescription);
const siteName = computed(() => profile.value?.name ?? "Portfolio");
const imageUrl = computed(() => {
  const path = profile.value?.profileImage ?? "/myself.jpeg";
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
});

useHead({
  title,
  link: [{ rel: "canonical", href: `${baseUrl}/` }],
  meta: [{ name: "robots", content: "index, follow" }],
});
useSeoMeta({
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: baseUrl,
  ogSiteName: siteName,
  ogLocale: "en_US",
  ogType: "website",
  ogImage: imageUrl,
  ogImageWidth: "1200",
  ogImageHeight: "630",
  ogImageAlt: siteName,
  twitterCard: "summary_large_image",
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: imageUrl,
});
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
