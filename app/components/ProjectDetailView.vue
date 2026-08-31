<script setup lang="ts">
// Dossier
// head, numbered contents rail with scrollspy, deep-parsed markdown doc
// (expandable images + mermaid), field notes, back-to-top.
import { computed, defineComponent, h, onMounted, onUnmounted, ref, watch } from "vue";
import type { PropType, VNode } from "vue";
import { marked } from "marked";
import type { Token, Tokens } from "marked";
import { statusFor, initialsFor } from "~/utils/projects";

type Project = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: string;
  imageUrl?: string | null;
  demoUrl?: string | null;
  repoUrl?: string | null;
  content?: string | null;
  updatedAt?: string | null;
};

const props = defineProps<{
  project: Project;
  registry?: { no: number; total: number };
}>();

// the head already carries the title — don't render "# Title" again in the doc
function stripTitleHeading(content: string, title: string) {
  const lines = content.split("\n");
  if (lines[0]?.trim().toLowerCase() === `# ${title}`.toLowerCase()) {
    return lines.slice(1).join("\n").replace(/^\n+/, "");
  }
  return content;
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const slug = (text: string) => text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

const docSource = computed(() => stripTitleHeading(props.project.content ?? "", props.project.title));

// derived during render so the contents rail is server-rendered —
// if it only appeared after mount, the doc would sit in the rail's 260px column
const headings = computed(() => {
  if (!docSource.value) return [];

  const extracted: { id: string; text: string; level: number; num: string }[] = [];
  let h2 = 0;
  let h3 = 0;

  docSource.value.split("\n").forEach((line) => {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2];
      const id = slug(text);

      if (level <= 2) {
        h2 += 1;
        h3 = 0;
        extracted.push({ id, text, level, num: pad2(h2) });
      } else {
        h3 += 1;
        extracted.push({ id, text, level, num: `${pad2(h2)}.${h3}` });
      }
    }
  });

  return extracted;
});

// block-level token tree — rendered by <DocBlocks> below
const blocks = computed<Token[]>(() => (docSource.value ? marked.lexer(docSource.value) : []));

const activeSection = ref("");
const navRef = ref<HTMLElement | null>(null);

// rAF-throttled: at most one section lookup per frame, no matter the scroll rate
let scrollRaf = 0;
function updateActiveSection() {
  scrollRaf = 0;
  const scrollPosition = window.scrollY + 150;
  let currentSection = "";

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
    if (headings.value.length > 0) {
      currentSection = headings.value[headings.value.length - 1].id;
    }
  } else {
    for (const heading of headings.value) {
      const element = document.getElementById(heading.id);
      if (element && element.offsetTop <= scrollPosition) {
        currentSection = heading.id;
      }
    }
  }

  if (currentSection) {
    activeSection.value = currentSection;
  }
}
function onDocScroll() {
  if (!scrollRaf) scrollRaf = requestAnimationFrame(updateActiveSection);
}
onMounted(() => {
  window.addEventListener("scroll", onDocScroll, { passive: true });
  updateActiveSection();
});
onUnmounted(() => {
  window.removeEventListener("scroll", onDocScroll);
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
});

// Auto-scroll the sidebar nav to keep active item visible
watch(activeSection, (id) => {
  const container = navRef.value;
  if (!id || !container) return;
  const activeElement = container.querySelector<HTMLElement>(`a[href="#${id}"]`);
  if (activeElement) {
    const elementTop = activeElement.offsetTop;
    const elementBottom = elementTop + activeElement.offsetHeight;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;

    // only the sidebar scrolls, never the main window
    if (elementTop < containerTop) {
      container.scrollTo({ top: elementTop, behavior: "smooth" });
    } else if (elementBottom > containerBottom) {
      container.scrollTo({ top: elementBottom - container.clientHeight, behavior: "smooth" });
    }
  }
});

function selectSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  activeSection.value = id;
}

const expandedContent = ref<string | null>(null);
const expandedType = ref<"image" | "mermaid" | null>(null);
function expand(content: string, type: "image" | "mermaid") {
  expandedContent.value = content;
  expandedType.value = type;
}
function closeExpanded() {
  expandedContent.value = null;
  expandedType.value = null;
}

// ---- doc renderer: maps marked tokens to component markup ----

function renderImage(token: { href: string; text: string }): VNode {
  const children: (VNode | string)[] = [
    h("img", { src: token.href, alt: token.text, class: "h-auto w-full" }),
  ];
  if (token.text) {
    children.push(
      h("figcaption", { class: "border-t border-line px-3 py-1.5 font-mono text-[10.5px] tracking-[0.1em] text-dim" }, token.text),
    );
  }
  return h("figure", {
    class: "mb-[18px] cursor-pointer border border-line transition-all hover:ring-2 hover:ring-phosphor",
    title: "Click to expand image",
    onClick: () => expand(token.href, "image"),
  }, children);
}

function renderInline(tokens: Token[] | undefined): (VNode | string)[] {
  if (!tokens) return [];
  return tokens.flatMap((tk): VNode | string => {
    switch (tk.type) {
      case "text": {
        const t = tk as Tokens.Text;
        return t.tokens?.length ? renderInline(t.tokens) : t.text;
      }
      case "escape":
        return (tk as Tokens.Escape).text;
      case "strong":
        return h("strong", { class: "font-semibold text-bright" }, renderInline((tk as Tokens.Strong).tokens));
      case "em":
        return h("em", renderInline((tk as Tokens.Em).tokens));
      case "del":
        return h("del", renderInline((tk as Tokens.Del).tokens));
      case "link": {
        const t = tk as Tokens.Link;
        return h(
          "a",
          {
            href: t.href,
            target: "_blank",
            rel: "noopener noreferrer",
            class: "text-phosphor underline underline-offset-4 transition-colors hover:text-phosphor/80",
          },
          renderInline(t.tokens),
        );
      }
      case "codespan":
        return h(
          "code",
          { class: "border border-line bg-panel px-[5px] py-px font-mono text-[0.85em] text-phosphor" },
          (tk as Tokens.Codespan).text,
        );
      case "image":
        return renderImage(tk as Tokens.Image);
      case "br":
        return h("br");
      case "html":
        // raw inline html — own CMS content
        return h("span", { innerHTML: (tk as Tokens.Html).text });
      default:
        return String((tk as Tokens.Generic).text ?? "");
    }
  });
}

const LI_CLASS =
  "relative pl-5 before:absolute before:left-0 before:top-[7px] before:text-[11px] before:text-phosphor before:content-['▸_'] [&>ol]:list-decimal [&>ul]:list-none [&>ul>li]:before:content-none";

function renderListItem(item: Tokens.ListItem): VNode {
  const children: (VNode | string)[] = [];
  for (const tk of item.tokens ?? []) {
    if (tk.type === "text") {
      const t = tk as Tokens.Text;
      children.push(...(t.tokens?.length ? renderInline(t.tokens) : [t.text]));
    } else if (tk.type === "space") {
      continue;
    } else {
      const rendered = renderBlock(tk);
      if (rendered) children.push(rendered);
    }
  }
  return h("li", { class: LI_CLASS }, children);
}

function renderList(token: Tokens.List): VNode {
  return h(
    token.ordered ? "ol" : "ul",
    {
      class: token.ordered
        ? "mb-[18px] space-y-1.5 text-[15.5px] leading-[1.75] text-text-secondary list-decimal list-outside ml-5"
        : "mb-[18px] space-y-1.5 text-[15.5px] leading-[1.75] text-text-secondary list-none",
    },
    token.items.map(renderListItem),
  );
}

function renderBlock(tk: Token): VNode | null {
  switch (tk.type) {
    case "heading": {
      const t = tk as Tokens.Heading;
      const id = slug(t.text);
      if (t.depth <= 2) {
        return h(
          `h${t.depth}`,
          {
            id,
            class: `flex items-baseline gap-2.5 border-b border-line pb-2 text-[20px] font-bold tracking-[-0.01em] text-bright mt-10 mb-[18px] scroll-mt-[110px]${t.depth === 1 ? " first:mt-0" : ""}`,
          },
          [h("span", { class: "font-mono text-[16px] font-normal text-phosphor" }, "#"), ...renderInline(t.tokens)],
        );
      }
      if (t.depth === 3) {
        return h("h3", { id, class: "text-[16.5px] font-bold text-bright mt-7 mb-1.5 scroll-mt-[110px]" }, renderInline(t.tokens));
      }
      return h(`h${t.depth}`, renderInline(t.tokens));
    }
    case "paragraph":
      return h(
        "p",
        { class: "mb-[18px] text-[15.5px] leading-[1.75] text-text-secondary" },
        renderInline((tk as Tokens.Paragraph).tokens),
      );
    case "code": {
      const t = tk as Tokens.Code;
      const language = (t.lang ?? "").trim().split(/\s+/)[0] ?? "";

      // Handle mermaid code blocks
      if (language === "mermaid") {
        const chart = t.text.replace(/\n$/, "");
        return h("div", {
          class: "mb-[18px] cursor-pointer border border-line transition-all hover:ring-2 hover:ring-phosphor",
          title: "Click to expand diagram",
          onClick: () => expand(chart, "mermaid"),
        }, [h(UiMermaidDiagram, { chart })]);
      }

      return h("div", { class: "mb-[18px] border border-line bg-[#0D0D0F]" }, [
        h(
          "div",
          { class: "flex justify-between border-b border-line px-3.5 py-[6px] font-mono text-[10.5px] uppercase tracking-[0.14em] text-dim" },
          [h("span", "code"), h("span", `${props.project.id}/readme.md`)],
        ),
        h("div", { class: "overflow-x-auto px-4 py-3.5" }, [
          h(
            "code",
            {
              class: "block font-mono text-[12.5px] leading-[1.7] text-text-secondary",
              style: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
            },
            t.text,
          ),
        ]),
      ]);
    }
    case "blockquote":
      return h(
        "blockquote",
        {
          class:
            "mb-[18px] border-l-2 border-phosphor bg-phosphor/5 px-4 py-2.5 text-[15.5px] italic leading-[1.75] text-text-secondary",
        },
        (tk as Tokens.Blockquote).tokens.map(renderBlock).filter((n): n is VNode => n !== null),
      );
    case "table": {
      const t = tk as Tokens.Table;
      return h("div", { class: "mb-[18px] overflow-x-auto border border-line" }, [
        h("table", { class: "w-full border-collapse text-[14px] text-text-secondary" }, [
          h("thead", { class: "bg-panel" }, [
            h(
              "tr",
              t.header.map((cell) =>
                h("th", { class: "border-b border-line px-3.5 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-dim" }, renderInline(cell.tokens)),
              ),
            ),
          ]),
          h(
            "tbody",
            t.rows.map((row) =>
              h(
                "tr",
                row.map((cell) => h("td", { class: "border-b border-line/60 px-3.5 py-2" }, renderInline(cell.tokens))),
              ),
            ),
          ),
        ]),
      ]);
    }
    case "hr":
      return h("hr", { class: "my-8 border-line" });
    case "list":
      return renderList(tk as Tokens.List);
    case "html":
      // raw block html — own CMS content
      return h("div", { innerHTML: (tk as Tokens.Html).text });
    case "space":
      return null;
    case "text":
      // loose block text — render like a paragraph
      return h(
        "p",
        { class: "mb-[18px] text-[15.5px] leading-[1.75] text-text-secondary" },
        (tk as Tokens.Text).tokens?.length ? renderInline((tk as Tokens.Text).tokens) : [(tk as Tokens.Text).text],
      );
    default:
      return null;
  }
}

// renders the doc so expand handlers stay live Vue handlers
const DocBlocks = defineComponent({
  props: { tokens: { type: Array as PropType<Token[]>, required: true } },
  setup(docProps) {
    return () => docProps.tokens.map(renderBlock).filter((n): n is VNode => n !== null);
  },
});

// isolated so its scroll updates never re-render the page above it;
// no transition on `bottom` — it must track the footer exactly, not lag behind it
const BackToTopButton = defineComponent({
  setup() {
    const visible = ref(false);
    const lift = ref(0);

    let raf = 0;
    const update = () => {
      raf = 0;
      visible.value = window.scrollY > 400;
      const remaining = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      const footerHeight = document.querySelector("footer")?.offsetHeight ?? 0;
      lift.value = Math.max(0, footerHeight + 16 - remaining);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    onMounted(() => {
      window.addEventListener("scroll", onScroll, { passive: true });
      update();
    });
    onUnmounted(() => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    });

    return () =>
      h(
        "button",
        {
          onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
          "aria-label": "back to top",
          style: { bottom: `calc(1.5rem + ${lift.value}px)` },
          class: `fixed right-6 z-40 flex items-center gap-2 border border-line bg-panel/90 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-dim backdrop-blur transition-[opacity,transform,border-color,color] duration-200 hover:border-phosphor/50 hover:text-phosphor ${
            visible.value ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
          }`,
        },
        [h("span", { "aria-hidden": "true", class: "text-phosphor" }, "↑"), " top"],
      );
  },
});

const st = computed(() => statusFor(props.project.status));
const stamp = computed(() =>
  st.value.dimmed
    ? { box: "border-line text-dim", dot: "border border-dim" }
    : st.value.wip
      ? { box: "border-amber/45 text-amber", dot: "bg-amber shadow-[0_0_10px_rgba(255,180,84,0.8)] animate-pulse" }
      : { box: "border-phosphor/45 text-phosphor", dot: "bg-phosphor shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse" },
);

const updatedLabel = computed(() => {
  const updatedAt = props.project.updatedAt ? new Date(props.project.updatedAt) : null;
  return updatedAt && !isNaN(updatedAt.getTime())
    ? `${updatedAt.getFullYear()}-${pad2(updatedAt.getMonth() + 1)}`
    : null;
});

const hasActions = computed(() => Boolean(props.project.demoUrl || props.project.repoUrl));
</script>

<template>
  <div class="relative">
    <!-- dossier head -->
    <div class="mx-auto max-w-[1200px] px-6 pt-[34px] md:px-9">
      <NuxtLink
        to="/projects"
        class="group relative z-[1] inline-block border border-b-0 border-line bg-panel px-4 pb-[6px] pt-[7px] font-mono text-[11px] uppercase tracking-[0.14em] text-dim transition-colors hover:border-border-subtle"
      >
        <b class="font-medium text-phosphor">
          <span aria-hidden class="inline-block transition-transform group-hover:-translate-x-1">←</span> registry
        </b>
        {{ " · " }}
        {{ props.project.id }}/readme.md
      </NuxtLink>

      <div class="brackets grid border border-line bg-panel/55 max-lg:grid-cols-1 lg:grid-cols-[minmax(0,1fr)_460px]">
        <div class="px-[30px] pb-[26px] pt-[30px]">
          <div class="mb-[18px] flex flex-wrap items-center justify-between gap-3">
            <span
              class="inline-flex items-center gap-2 border px-3 py-[5px] font-mono text-[10.5px] uppercase tracking-[0.2em]"
              :class="stamp.box"
            >
              <i class="h-1.5 w-1.5 rounded-full" :class="stamp.dot" />
              {{ st.label }}
            </span>
            <span class="font-mono text-[11px] tracking-[0.12em] text-dim">
              {{ props.project.category?.toLowerCase() }}
              <template v-if="props.registry"> · {{ pad2(props.registry.no) }}/{{ pad2(props.registry.total) }}</template>
              <template v-if="updatedLabel"> · updated {{ updatedLabel }}</template>
            </span>
          </div>

          <h1 class="text-[clamp(2rem,3.8vw,2.8rem)] font-bold leading-[1.06] tracking-[-0.02em] text-bright">
            {{ props.project.title }}
          </h1>
          <p class="mt-[14px] max-w-[54ch] text-[16px] leading-[1.7] text-text-secondary">
            {{ props.project.description }}
          </p>

          <div class="mt-[18px] flex flex-wrap gap-1.5">
            <span
              v-for="tag in props.project.tags"
              :key="tag"
              class="border border-line px-[9px] py-[3px] font-mono text-[10.5px] uppercase tracking-[0.06em] text-dim"
            >
              {{ tag }}
            </span>
          </div>

          <div v-if="hasActions" class="mt-[22px] flex flex-wrap gap-2.5 border-t border-dashed border-line pt-5">
            <a
              v-if="props.project.demoUrl"
              :href="props.project.demoUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="border border-phosphor/55 px-4 py-[9px] font-mono text-[12px] text-phosphor transition-colors hover:bg-phosphor/10"
            >
              view live deployment
            </a>
            <a
              v-if="props.project.repoUrl"
              :href="props.project.repoUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="border border-line px-4 py-[9px] font-mono text-[12px] text-dim transition-colors hover:border-border-subtle hover:text-bright"
            >
              source code
            </a>
          </div>
        </div>

        <div class="relative min-h-[240px] overflow-hidden border-line bg-[#0D0D0F] max-lg:border-t lg:border-l lg:min-h-[340px]">
          <img
            v-if="props.project.imageUrl"
            :src="props.project.imageUrl"
            :alt="`${props.project.title} — system screen`"
            class="absolute inset-0 h-full w-full object-cover"
          />
          <div
            v-else
            class="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_90%_70%_at_50%_20%,rgba(74,222,128,0.08),transparent_60%)] font-mono text-[2.6rem] font-bold text-phosphor/45"
          >
            {{ initialsFor(props.project.title) }}
          </div>
          <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(74,222,128,0.06),transparent_38%,rgba(10,10,11,0.5))]" />
          <span aria-hidden class="absolute -left-px -top-px h-[10px] w-[10px] border-l-2 border-t-2 border-phosphor" />
          <span class="absolute bottom-2.5 left-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-dim/70">
            img 00 · captured from the live deployment
          </span>
        </div>
      </div>
    </div>

    <!-- body — contents rail + doc -->
    <div class="mx-auto grid max-w-[1200px] gap-12 px-6 pb-[60px] pt-[38px] md:px-9 max-lg:grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside v-if="headings.length > 0" class="hidden lg:block">
        <div class="sticky top-[100px]">
          <div class="mb-3 flex justify-between border-b border-line pb-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-dim">
            <span>contents</span>
            <em class="not-italic text-phosphor">{{ headings.filter((h) => h.level <= 2).length }}</em>
          </div>
          <nav
            ref="navRef"
            aria-label="document sections"
            class="max-h-[calc(100vh-13rem)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <a
              v-for="heading in headings"
              :key="heading.id"
              :href="`#${heading.id}`"
              class="flex items-baseline gap-2.5 border-b border-dashed border-line/60 py-1.5 font-mono text-[12px] transition-colors"
              :class="activeSection === heading.id ? 'text-phosphor' : 'text-dim hover:text-text-secondary'"
              @click.prevent="selectSection(heading.id)"
            >
              <i class="not-italic text-[10.5px]" :class="activeSection === heading.id ? 'text-phosphor' : 'text-dim/50'">{{ heading.num }}</i>
              {{ heading.text }}
            </a>
          </nav>
        </div>
      </aside>

      <div class="min-w-0 max-lg:col-start-1 lg:col-start-2 lg:row-start-1">
        <div v-if="docSource" class="max-w-[74ch]">
          <DocBlocks :tokens="blocks" />
        </div>
        <div v-else class="border border-dashed border-line bg-panel/50 px-6 py-16 text-center">
          <p class="font-mono text-[13px] text-dim">documentation module not initialized — no readme.md in this file.</p>
        </div>

        <CommentsSection :project-id="props.project.id" />
      </div>
    </div>

    <BackToTopButton />

    <UiExpandableModal :is-open="!!expandedContent" @close="closeExpanded">
      <img
        v-if="expandedContent && expandedType === 'image'"
        :src="expandedContent"
        alt="Expanded view"
        class="h-auto max-h-[90vh] w-auto max-w-[90vw] object-contain"
      />
      <div
        v-if="expandedContent && expandedType === 'mermaid'"
        class="flex h-[90vh] w-[95vw] flex-col overflow-hidden border border-line bg-panel p-4"
      >
        <UiMermaidDiagram
          :chart="expandedContent"
          class="m-0! flex h-full w-full items-center justify-center border-0! p-0! shadow-none! [&>svg]:h-full [&>svg]:w-full [&>svg]:max-w-none"
        />
      </div>
    </UiExpandableModal>
  </div>
</template>
