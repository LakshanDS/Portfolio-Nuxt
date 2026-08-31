<script setup lang="ts">
const route = useRoute();
const isMobileMenuOpen = ref(false);

const NAV_LINKS = [
  { href: "/", label: "home", match: (p: string) => p === "/" },
  { href: "/projects", label: "work", match: (p: string) => p.startsWith("/projects") },
  { href: "/roadmap", label: "career.log", match: (p: string) => p.startsWith("/roadmap") },
  { href: "/about", label: "about", match: (p: string) => p.startsWith("/about") },
];
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b border-line bg-abyss/90 backdrop-blur-md">
    <div class="mx-auto grid w-full max-w-[1200px] grid-cols-[auto_1fr_auto] items-center px-6 py-5 max-md:grid-cols-[1fr_auto]">
      <!-- Brand -->
      <NuxtLink to="/" class="font-mono text-[13px] font-medium text-phosphor">
        <span class="text-amber">◤ </span>Lakshan De Silva
      </NuxtLink>

      <!-- Desktop Navigation -->
      <nav class="hidden justify-center gap-6 md:flex">
        <NuxtLink
          v-for="link in NAV_LINKS"
          :key="link.href"
          :to="link.href"
          class="font-mono text-[13px] transition-colors"
          :class="link.match(route.path) ? 'text-phosphor' : 'text-dim hover:text-phosphor'"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Resume + Mobile Menu -->
      <div class="flex items-center gap-4 justify-self-end">
        <a
          href="/resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden border border-phosphor px-[13px] py-1.5 font-mono text-[11.5px] text-phosphor transition-colors hover:bg-phosphor/10 sm:block"
        >
          $ wget resume.pdf
        </a>
        <button class="text-xl text-bright md:hidden" aria-label="Toggle menu" @click="isMobileMenuOpen = !isMobileMenuOpen">
          <!-- FaTimes / FaBars icons -->
          <svg v-if="isMobileMenuOpen" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 352 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0l-22.24 22.24c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.19 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.19 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z" />
          </svg>
          <svg v-else stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <nav v-if="isMobileMenuOpen" class="border-t border-line bg-panel px-6 py-4 md:hidden">
      <div class="flex flex-col gap-4">
        <NuxtLink
          v-for="link in NAV_LINKS"
          :key="link.href"
          :to="link.href"
          class="font-mono text-[13px]"
          :class="link.match(route.path) ? 'text-phosphor' : 'text-dim'"
          @click="isMobileMenuOpen = false"
        >
          {{ link.label }}
        </NuxtLink>
        <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" class="font-mono text-[13px] text-phosphor">
          $ wget resume.pdf
        </a>
      </div>
    </nav>
  </header>
</template>
