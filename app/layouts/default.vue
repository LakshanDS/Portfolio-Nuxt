<template>
  <div class="relative z-[1] flex min-h-screen flex-col">
    <PageTracker />
    <OpsBackground />
    <SiteHeader />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
