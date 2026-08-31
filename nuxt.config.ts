// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/icon"],
  devServer: { port: 3000 },
  css: ["~/assets/css/globals.css"],
  vite: { plugins: [tailwindcss()] },
  nitro: { preset: "cloudflare_module" },

  runtimeConfig: {
    public: {
      siteURL: "http://localhost:3000",
    },
  },

  app: {
    head: {
      script: [{ innerHTML: "document.documentElement.classList.add('reveal-ready')" }],
      htmlAttrs: { lang: "en", class: "dark" },
      bodyAttrs: { class: "font-sans antialiased" },
    },
  },
});
