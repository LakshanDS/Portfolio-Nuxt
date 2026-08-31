<script setup lang="ts">
// Login page — same flow, markup and shapes.
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

// Check if user is registered on mount
onMounted(() => {
  checkRegistrationStatus();
});

async function checkRegistrationStatus() {
  try {
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
    error.value = "Failed to load. Please refresh the page.";
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
      error.value = "Login failed. Please try again.";
    }
  } finally {
    isLoading.value = false;
  }
}

function applyLoginError(data: LoginResponse) {
  error.value = data.error || "Invalid OTP code";
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
</script>

<template>
  <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0a0a0b] via-[#141416] to-[#0a0a0b] flex items-center justify-center p-6">
    <!-- Animated gradient orbs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-green-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-cyan-500/10 to-emerald-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-amber-500/5 to-pink-600/5 rounded-full blur-3xl animate-pulse delay-500"></div>
    </div>

    <div class="w-full relative z-10 transition-all duration-500 ease-in-out" :class="isRegistered === false ? 'max-w-4xl' : 'max-w-md'">
      <!-- Header with gradient text -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-sm border border-emerald-500/20 mb-4">
          <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-green-300 to-cyan-400 bg-clip-text text-transparent mb-2">
          Admin Access
        </h1>
        <p class="text-[#d4d4ce] text-sm font-mono">
          <span class="text-emerald-400">&gt;_</span>
          {{ isRegistered === false ? "First time setup - scan QR code" : "Enter your authentication code" }}
        </p>
      </div>

      <div class="relative backdrop-blur-xl bg-black/80 rounded-2xl border border-emerald-500/20 shadow-2xl shadow-emerald-900/10 overflow-hidden">
        <!-- Gradient border effect - Darker Green -->
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-cyan-900/20 pointer-events-none"></div>

        <div class="relative p-8">
          <div v-if="isRegistered === null" class="text-center py-12">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-600/20 mb-4">
              <div class="animate-spin rounded-full h-8 w-8 border-2 border-emerald-400 border-t-transparent"></div>
            </div>
            <p class="text-sm text-[#d4d4ce]">Initializing...</p>
          </div>

          <div v-else-if="!isRegistered" class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-2">
            <!-- Left Column: QR Code & Secret -->
            <div class="flex flex-col items-center justify-center p-6 bg-emerald-950/10 rounded-xl border border-emerald-500/10 space-y-6 h-full">
              <div class="text-center w-full">
                <span class="text-xs font-medium text-emerald-400 uppercase tracking-widest mb-4 block">Scan Me</span>
                <div v-if="qrCodeUrl" class="inline-block p-4 bg-white rounded-xl shadow-lg shadow-emerald-500/10 select-none">
                  <img :src="qrCodeUrl" alt="QR Code" class="w-48 h-48 md:w-56 md:h-56 object-contain" />
                </div>
              </div>

              <div class="text-center w-full space-y-2">
                <p class="text-[10px] text-emerald-400/60 uppercase tracking-wider">Or enter secret manually</p>
                <code class="block w-full text-center p-3 bg-black/60 rounded-lg border border-emerald-500/20 text-emerald-400 font-mono text-sm tracking-widest break-all select-all shadow-inner">
                  {{ secret || "Generating..." }}
                </code>
              </div>
            </div>

            <!-- Right Column: Instructions & Form -->
            <div class="space-y-6 h-full flex flex-col justify-center">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                  <div class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">i</div>
                  Instructions
                </h3>
                <div class="space-y-3 pl-2">
                  <div class="flex items-start gap-3 text-sm text-[#d4d4ce]">
                    <span class="text-emerald-400 font-bold mt-0.5">1.</span>
                    <p>Open <span class="text-emerald-400 font-medium">Google Authenticator</span></p>
                  </div>
                  <div class="flex items-start gap-3 text-sm text-[#d4d4ce]">
                    <span class="text-emerald-400 font-bold mt-0.5">2.</span>
                    <p>Scan the <span class="text-emerald-400 font-medium">QR code</span> or enter the <span class="text-emerald-400 font-medium">Secret Key</span></p>
                  </div>
                  <div class="flex items-start gap-3 text-sm text-[#d4d4ce]">
                    <span class="text-emerald-400 font-bold mt-0.5">3.</span>
                    <p>Enter the generated <span class="text-emerald-400 font-medium">6-digit code</span> below</p>
                  </div>
                </div>
              </div>

              <form class="space-y-6 pt-4 border-t border-white/5" @submit.prevent="handleOtpSubmit">
                <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 backdrop-blur-sm">
                  <p class="text-sm text-red-400 text-center">{{ error }}</p>
                  <p v-if="remainingAttempts !== null" class="text-xs text-red-300 text-center mt-1">
                    {{ remainingAttempts }} attempts remaining
                  </p>
                  <p v-if="rateLimitResetTime !== null" class="text-xs text-red-300 text-center mt-1">
                    Try again in {{ formatTime(rateLimitResetTime) }}
                  </p>
                </div>

                <div class="space-y-3">
                  <label class="text-xs font-semibold text-emerald-400/90 block uppercase tracking-wider">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    :value="otpCode"
                    @input="onOtpInput"
                    class="block w-full px-4 py-3 bg-gradient-to-br from-[#141416] to-[#141416] border-2 border-emerald-500/20 rounded-xl text-[#f5f5f0] text-center text-3xl tracking-[0.5em] focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all font-mono placeholder:text-gray-700"
                    placeholder="• • • • • •"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="6"
                    required
                    autofocus
                  />
                </div>

                <button
                  type="submit"
                  :disabled="otpCode.length !== 6 || isLoading"
                  class="w-full py-3.5 px-6 rounded-xl font-semibold text-sm
                    bg-gradient-to-r from-emerald-500 to-green-600 text-white
                    hover:from-emerald-400 hover:to-green-500
                    disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
                    transform hover:scale-[1.02] active:scale-[0.98]
                    transition-all duration-200
                    shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40
                    disabled:shadow-none
                    relative overflow-hidden group"
                >
                  <span class="relative z-10 flex items-center justify-center gap-2">
                    <template v-if="isLoading">
                      <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Verifying...
                    </template>
                    <template v-else>
                      Complete Registration
                      <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </template>
                  </span>
                  <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>
              </form>
            </div>
          </div>

          <!-- Regular login - just OTP field -->
          <form v-else class="space-y-6" @submit.prevent="handleOtpSubmit">
            <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 backdrop-blur-sm">
              <p class="text-sm text-red-400 text-center">{{ error }}</p>
              <p v-if="remainingAttempts !== null" class="text-xs text-red-300 text-center mt-1">
                {{ remainingAttempts }} attempts remaining
              </p>
              <p v-if="rateLimitResetTime !== null" class="text-xs text-red-300 text-center mt-1">
                Try again in {{ formatTime(rateLimitResetTime) }}
              </p>
            </div>

            <div class="text-center space-y-4">
              <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-sm border border-emerald-500/20 mb-2">
                <svg
                  class="w-10 h-10 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <p class="text-sm text-[#d4d4ce]">
                Enter your 6-digit code from<br />
                <span class="text-emerald-400 font-medium">Google Authenticator</span>
              </p>
            </div>

            <div class="space-y-3">
              <label class="text-xs font-semibold text-emerald-400/90 block uppercase tracking-wider">
                Authentication Code
              </label>
              <input
                type="text"
                :value="otpCode"
                @input="onOtpInput"
                class="block w-full px-4 py-3 bg-gradient-to-br from-[#141416] to-[#141416] border-2 border-emerald-500/20 rounded-xl text-[#f5f5f0] text-center text-3xl tracking-[0.5em] focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all font-mono placeholder:text-gray-700"
                placeholder="• • • • • •"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="6"
                required
                autofocus
              />
            </div>

            <button
              type="submit"
              :disabled="otpCode.length !== 6 || isLoading"
              class="w-full py-3.5 px-6 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-emerald-500 to-green-600 text-white
                hover:from-emerald-400 hover:to-green-500
                disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
                transform hover:scale-[1.02] active:scale-[0.98]
                transition-all duration-200
                shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40
                disabled:shadow-none
                relative overflow-hidden group"
            >
              <span class="relative z-10 flex items-center justify-center gap-2">
                <template v-if="isLoading">
                  <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Authenticating...
                </template>
                <template v-else>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Unlock Dashboard
                  <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </template>
              </span>
              <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>
          </form>
        </div>
      </div>

      <!-- Footer info -->
      <div class="mt-6 text-center">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#141416]/50 backdrop-blur-sm border border-emerald-500/10">
          <svg class="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
          </svg>
          <p class="text-xs text-[#d4d4ce]">
            {{ isRegistered === false
              ? "One-time setup • Secure authentication"
              : "Session expires after 5 minutes" }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
