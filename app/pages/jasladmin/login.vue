<script setup lang="ts">
// Login page — terminal-styled TOTP gate.
// The QR data URL is generated server-side by GET /api/login;
// the csrf token travels in the POST body, not in headers.

interface LoginResponse {
  success: boolean;
  error?: string;
  remainingAttempts?: number;
  resetTime?: number;
}

const otpCode = ref("");
const isLoading = ref(false);
const error = ref<string | null>(null);
const isRegistered = ref<boolean | null>(null);
const qrCodeUrl = ref<string | null>(null);
const secret = ref<string | null>(null);
const tempId = ref<string | null>(null);
const csrfToken = ref<string | null>(null);
const remainingAttempts = ref<number | null>(null);
const rateLimitResetTime = ref<number | null>(null);
const copied = ref(false);

// Check if user is registered on mount
onMounted(() => {
  checkRegistrationStatus();
});

async function checkRegistrationStatus() {
  try {
    error.value = null;
    const data = await $fetch<{
      isRegistered: boolean;
      qrCodeUrl?: string;
      secret?: string;
      tempId?: string;
      csrfToken?: string;
    }>("/api/login");
    isRegistered.value = data.isRegistered;
    if (!data.isRegistered) {
      qrCodeUrl.value = data.qrCodeUrl ?? null;
      secret.value = data.secret ?? null;
      tempId.value = data.tempId ?? null;
    }
    csrfToken.value = data.csrfToken ?? null;
  } catch {
    error.value = "auth service unreachable";
  }
}

async function handleOtpSubmit() {
  isLoading.value = true;
  error.value = null;
  remainingAttempts.value = null;
  rateLimitResetTime.value = null;

  try {
    const data = await $fetch<LoginResponse>("/api/login", {
      method: "POST",
      body: {
        code: otpCode.value,
        tempId: tempId.value,
        csrfToken: csrfToken.value,
      },
    });

    if (data.success) {
      // Use window.location instead of the router to ensure cookie is sent
      window.location.href = "/jasladmin/dashboard";
    } else {
      applyLoginError(data);
    }
  } catch (err: unknown) {
    // $fetch throws on non-2xx (401/403/429) — treat the parsed error
    // body as a non-success response
    const data = (err as { data?: LoginResponse })?.data;
    if (data && typeof data === "object") {
      applyLoginError(data);
    } else {
      error.value = "login failed — try again";
    }
  } finally {
    isLoading.value = false;
  }
}

function applyLoginError(data: LoginResponse) {
  error.value = data.error || "invalid code";
  otpCode.value = "";
  if (data.remainingAttempts !== undefined) {
    remainingAttempts.value = data.remainingAttempts;
  }
  if (data.resetTime !== undefined) {
    rateLimitResetTime.value = data.resetTime;
  }
}

// manual controlled input: filter to 6 digits and echo back to the DOM
function onOtpInput(e: Event) {
  const el = e.target as HTMLInputElement;
  otpCode.value = el.value.replace(/\D/g, "").slice(0, 6);
  el.value = otpCode.value;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

async function copySecret() {
  if (!secret.value) return;
  await navigator.clipboard.writeText(secret.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}
</script>

<template>
  <div class="relative flex min-h-[calc(100dvh-76px)] items-center justify-center overflow-hidden bg-abyss px-6 py-8">
    <!-- CRT depth, same device as the rest of the site -->
    <div class="scanlines opacity-40" aria-hidden="true" />

    <div
      class="relative z-10 w-full transition-all duration-300"
      :class="isRegistered === false ? 'max-w-[880px]' : 'max-w-[440px]'"
    >
      <div class="border border-line bg-panel/70">
        <!-- terminal titlebar -->
        <div class="flex items-center justify-between border-b border-line px-[18px] py-3 font-mono text-[11.5px] uppercase tracking-[0.16em] text-dim">
          <span>admin@portfolio:~$ {{ isRegistered === false ? "auth --pair" : "auth --unlock" }}</span>
        </div>

        <div class="p-6 max-md:p-5">
          <!-- resolving / unreachable -->
          <div v-if="isRegistered === null" class="py-10 text-center font-mono">
            <template v-if="!error">
              <p class="text-[13.5px] text-text-secondary">
                <span class="text-phosphor">$</span> initializing secure channel<span class="cursor-block ml-1 text-phosphor" aria-hidden="true">▮</span>
              </p>
            </template>
            <template v-else>
              <p class="text-[13.5px] text-amber">! {{ error }}</p>
              <button class="mt-6 border border-phosphor px-[22px] py-3 font-mono text-[13.5px] text-phosphor transition-colors hover:bg-phosphor/10" @click="checkRegistrationStatus">
                $ retry --connect
              </button>
            </template>
          </div>

          <!-- first run: pair authenticator -->
          <div v-else-if="!isRegistered" class="grid grid-cols-1 gap-7 md:grid-cols-[.9fr_1.1fr] max-md:gap-7">
            <!-- scan target -->
            <div class="brackets flex flex-col border border-line">
              <div class="border-b border-line px-[18px] py-3 font-mono text-[11.5px] uppercase tracking-[0.16em] text-dim">
                // scan target
              </div>
              <div class="flex flex-1 flex-col items-center justify-center gap-4 p-5">
                <div v-if="qrCodeUrl" class="brackets bg-bright p-4">
                  <img :src="qrCodeUrl" alt="TOTP pairing QR code" class="block size-40 object-contain md:size-44" />
                </div>
                <div class="w-full space-y-2 text-center">
                  <p class="font-mono text-[10.5px] uppercase tracking-[0.18em] text-dim">// manual entry key</p>
                  <code class="block w-full overflow-x-auto border border-line bg-abyss px-3 py-2.5 text-center font-mono text-[11px] tracking-[0.06em] text-phosphor whitespace-nowrap">
                    {{ secret || "…" }}
                  </code>
                  <button
                    type="button"
                    class="border border-line px-3 py-1.5 font-mono text-[11.5px] text-text-secondary transition-colors hover:border-dim"
                    @click="copySecret"
                  >
                    {{ copied ? "$ copied ✓" : "$ copy" }}
                  </button>
                </div>
              </div>
            </div>

            <!-- steps + form -->
            <div class="flex flex-col justify-center">
              <p class="font-mono text-[12px] uppercase tracking-[0.22em] text-amber">// first run</p>
              <h1 class="mt-3 font-mono text-2xl font-bold text-bright">Pair your authenticator</h1>
              <ol class="mt-4 space-y-2.5 font-mono text-[13.5px] text-text-secondary">
                <li class="flex gap-3">
                  <span class="text-dim">01</span> open your authenticator app
                </li>
                <li class="flex gap-3">
                  <span class="text-dim">02</span> scan the code — or enter the key
                </li>
                <li class="flex gap-3">
                  <span class="text-dim">03</span> confirm with the 6-digit code below
                </li>
              </ol>

              <form class="mt-5 space-y-4 border-t border-line pt-5" @submit.prevent="handleOtpSubmit">
                <div v-if="error" class="border border-error/40 bg-error/10 px-4 py-3 font-mono text-[13px]">
                  <p class="text-error">! {{ error }}</p>
                  <p v-if="remainingAttempts !== null" class="mt-1 text-[12px] text-dim">attempts remaining: {{ remainingAttempts }}</p>
                  <p v-if="rateLimitResetTime !== null" class="mt-1 text-[12px] text-dim">retry window: {{ formatTime(rateLimitResetTime) }}</p>
                </div>

                <label class="block font-mono text-[11.5px] uppercase tracking-[0.18em] text-dim" for="otp">
                  verification code
                </label>
                <input
                  id="otp"
                  type="text"
                  :value="otpCode"
                  @input="onOtpInput"
                  class="block w-full border border-line bg-abyss px-4 py-3 text-center font-mono text-3xl tracking-[0.45em] text-bright transition-colors placeholder:text-dim/50 focus:border-phosphor focus:outline-none"
                  placeholder="······"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="6"
                  required
                  autofocus
                />

                <button
                  type="submit"
                  :disabled="otpCode.length !== 6 || isLoading"
                  class="w-full border border-phosphor px-[22px] py-3 font-mono text-[13.5px] text-phosphor transition-colors hover:bg-phosphor/10 disabled:cursor-not-allowed disabled:border-line disabled:text-dim"
                >
                  {{ isLoading ? "$ verifying…" : "$ pair --device" }}
                </button>
              </form>
            </div>
          </div>

          <!-- returning: unlock -->
          <form v-else class="space-y-6 py-4" @submit.prevent="handleOtpSubmit">
            <div class="text-center">
              <p class="font-mono text-[12px] uppercase tracking-[0.22em] text-amber">// restricted shell</p>
              <h1 class="mt-3 font-mono text-2xl font-bold text-bright">Admin access</h1>
              <p class="mt-2 font-mono text-[13.5px] text-text-secondary">
                <span class="text-phosphor">&gt;_</span> enter your authentication code
              </p>
            </div>

            <div v-if="error" class="border border-error/40 bg-error/10 px-4 py-3 text-center font-mono text-[13px]">
              <p class="text-error">! {{ error }}</p>
              <p v-if="remainingAttempts !== null" class="mt-1 text-[12px] text-dim">attempts remaining: {{ remainingAttempts }}</p>
              <p v-if="rateLimitResetTime !== null" class="mt-1 text-[12px] text-dim">retry window: {{ formatTime(rateLimitResetTime) }}</p>
            </div>

            <input
              type="text"
              :value="otpCode"
              @input="onOtpInput"
              class="block w-full border border-line bg-abyss px-4 py-3 text-center font-mono text-3xl tracking-[0.45em] text-bright transition-colors placeholder:text-dim/50 focus:border-phosphor focus:outline-none"
              placeholder="······"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              required
              autofocus
            />

            <button
              type="submit"
              :disabled="otpCode.length !== 6 || isLoading"
              class="w-full border border-phosphor px-[22px] py-3 font-mono text-[13.5px] text-phosphor transition-colors hover:bg-phosphor/10 disabled:cursor-not-allowed disabled:border-line disabled:text-dim"
            >
              {{ isLoading ? "$ verifying…" : "$ unlock --dashboard" }}
            </button>
          </form>
        </div>

        <!-- status line -->
        <div class="flex items-center justify-between border-t border-line px-[18px] py-3 font-mono text-[11.5px] uppercase tracking-[0.16em] text-dim max-md:flex-col max-md:gap-1">
          <span>{{ isRegistered === false ? "one-time setup · secret stays server-side" : "session ttl · 5 min" }}</span>
          <span class="text-phosphor/70">tls: on</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor-block {
  animation: blink 1.1s steps(1) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cursor-block {
    animation: none;
  }
}
</style>
