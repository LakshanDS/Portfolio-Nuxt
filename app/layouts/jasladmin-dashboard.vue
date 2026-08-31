<script setup lang="ts">
// Client session shell: 30s expiry poll, activity-debounced renewal, logout.
// The initial auth check happens in the route middleware before this renders.
interface SessionCheck {
  authenticated: boolean;
  timeRemaining?: number;
}

const router = useRouter();

// Renew session on user activity
async function renewSessionOnActivity() {
  try {
    await $fetch("/api/session/renew", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // best-effort — the next activity or expiry poll recovers
  }
}

let renewalTimeout: ReturnType<typeof setTimeout> | null = null;
const handleActivity = () => {
  if (renewalTimeout) {
    clearTimeout(renewalTimeout);
  }
  // Renew session after 2 seconds of activity (debounced)
  renewalTimeout = setTimeout(() => {
    renewSessionOnActivity();
  }, 2000);
};

let timerInterval: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  // Update session timer every 30s
  timerInterval = setInterval(async () => {
    try {
      const data = await $fetch<SessionCheck>("/api/session/check", {
        method: "GET",
        credentials: "include",
      });

      if (data.authenticated) {
        if (data.timeRemaining === 0) {
          await $fetch("/api/session/logout", {
            method: "POST",
            credentials: "include",
          });
          router.push("/jasladmin/login");
        }
      } else {
        router.push("/jasladmin/login");
      }
    } catch {
      // transient network issue — next poll decides redirect
    }
  }, 30000);

  window.addEventListener("mousemove", handleActivity);
  window.addEventListener("keydown", handleActivity);
  window.addEventListener("scroll", handleActivity);
  window.addEventListener("click", handleActivity);
});

onUnmounted(() => {
  clearInterval(timerInterval);
  if (renewalTimeout) {
    clearTimeout(renewalTimeout);
  }
  window.removeEventListener("mousemove", handleActivity);
  window.removeEventListener("keydown", handleActivity);
  window.removeEventListener("scroll", handleActivity);
  window.removeEventListener("click", handleActivity);
});

async function handleLogout() {
  try {
    await $fetch("/api/session/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Still redirect even if logout fails
  } finally {
    router.push("/jasladmin/login");
    reloadNuxtApp();
  }
}

const primaryLinks = [
  { to: "/jasladmin/dashboard", icon: "fa-solid:chart-line", label: "Overview" },
  { to: "/jasladmin/dashboard/homepage", icon: "fa:home", label: "Homepage" },
  { to: "/jasladmin/dashboard/projects", icon: "fa:folder", label: "Projects" },
  { to: "/jasladmin/dashboard/roadmap", icon: "fa:road", label: "Roadmap" },
  { to: "/jasladmin/dashboard/about-settings", icon: "fa-solid:sliders-h", label: "About" },
];

const contentLinks = [
  { to: "/jasladmin/dashboard/education", icon: "fa:graduation-cap", label: "Education" },
  { to: "/jasladmin/dashboard/experience", icon: "fa:briefcase", label: "Experience" },
  { to: "/jasladmin/dashboard/competencies", icon: "fa:folder", label: "Competencies" },
  { to: "/jasladmin/dashboard/skills", icon: "fa:folder", label: "Skills" },
];
</script>

<template>
  <div class="flex min-h-screen bg-[#141416]">
    <aside class="hidden w-56 flex-col border-r border-[#232326] bg-[#141416] md:flex">
      <div class="border-b border-[#232326] p-4">
        <!-- same brand mark as the landing header -->
        <NuxtLink to="/" class="flex flex-col font-mono text-[13px] font-medium text-phosphor">
          <span><span class="text-amber">◤ </span>Lakshan De Silva</span>
          <span class="text-[10px] tracking-wider text-[#75756C]">// control room</span>
        </NuxtLink>
      </div>

      <nav class="mt-2 flex-1 space-y-1 p-3">
        <NuxtLink
          v-for="link in primaryLinks"
          :key="link.to"
          :to="link.to"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#d4d4ce] transition-all hover:bg-[#232326] hover:text-[#f5f5f0]"
        >
          <Icon :name="link.icon" size="14" />
          {{ link.label }}
        </NuxtLink>

        <div class="mt-2 border-t border-[#232326] pt-2">
          <NuxtLink
            v-for="link in contentLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#d4d4ce] transition-all hover:bg-[#232326] hover:text-[#f5f5f0]"
          >
            <Icon :name="link.icon" size="14" />
            {{ link.label }}
          </NuxtLink>

          <div class="pt-2 mt-2">
            <UiButton
              variant="ghost"
              size="sm"
              class="w-full justify-start gap-2 px-3 py-2 text-xs text-[#F87171] hover:bg-red-500/10 hover:text-[#ef4444]"
              @click="handleLogout"
            >
              <Icon name="fa-solid:sign-out-alt" size="14" /> Logout
            </UiButton>
          </div>
        </div>
      </nav>

      <!-- Removed bottom settings as requested -->
    </aside>

    <main class="flex min-h-screen flex-1 flex-col">
      <div class="flex-1 overflow-y-auto p-6">
        <slot />
      </div>
    </main>
  </div>

  <!-- global toast host for all dashboard pages (useToast()) -->
  <UiToasts />
</template>
