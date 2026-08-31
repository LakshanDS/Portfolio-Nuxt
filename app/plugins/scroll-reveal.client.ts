/**
 * Reveals [data-reveal] elements once as they scroll into view.
 * Pairs with the .reveal-ready CSS in globals.css — app.head inlines the
 * reveal-ready class before first paint, so content only hides when JS is live.
 */
export default defineNuxtPlugin((nuxtApp) => {
  function observe() {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.revealed)"));
    if (targets.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );

    targets.forEach((el) => observer.observe(el));
  }

  nuxtApp.hook("app:mounted", observe);
  nuxtApp.hook("page:finish", () => setTimeout(observe, 0));
});
