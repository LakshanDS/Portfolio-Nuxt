<script setup lang="ts">
const route = useRoute();
const currentYear = new Date().getFullYear();
const links = ref<{ email?: string; githubUrl?: string; linkedinUrl?: string; whatsappUrl?: string }>({});

onMounted(async () => {
  try {
    const res = await fetch("/api/profile");
    const data = await res.json();
    if (data?.profile) {
      links.value = {
        email: data.profile.email,
        githubUrl: data.profile.githubUrl,
        linkedinUrl: data.profile.linkedinUrl,
        whatsappUrl: data.profile.whatsappUrl,
      };
    }
  } catch {
    // ignore
  }
});
</script>

<template>
  <footer v-if="!route.path.startsWith('/jasladmin')" class="w-full border-t border-line">
    <div class="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3.5 px-6 py-6 font-mono text-[12px] text-dim">
      <span>© {{ currentYear }} lakshan de silva</span>
      <span class="flex flex-wrap gap-5">
        <a
          v-if="links.email"
          :href="`mailto:${links.email}`"
          class="transition-colors hover:text-phosphor"
        >
          mail ↗
        </a>
        <a
          v-if="links.githubUrl"
          :href="links.githubUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="transition-colors hover:text-phosphor"
        >
          github ↗
        </a>
        <a
          v-if="links.linkedinUrl"
          :href="links.linkedinUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="transition-colors hover:text-phosphor"
        >
          linkedin ↗
        </a>
        <a
          v-if="links.whatsappUrl"
          :href="links.whatsappUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="transition-colors hover:text-phosphor"
        >
          whatsapp ↗
        </a>
      </span>
      <span>visits: anonymous · since 2024</span>
    </div>
  </footer>
</template>
