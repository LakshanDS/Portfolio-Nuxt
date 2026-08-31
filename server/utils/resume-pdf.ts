// Resume PDF builder — pure pdf-lib with Roboto loaded from cdnjs (the same
// files the original @react-pdf design used), cached per isolate. Falls back
// to the built-in Helvetica if the CDN is unreachable. Runs on Workers.
import {
  PDFDocument,
  StandardFonts,
  rgb,
  appendBezierCurve,
  clip,
  closePath,
  endPath,
  moveTo,
  popGraphicsState,
  pushGraphicsState,
  PDFName,
  PDFString,
  type PDFFont,
  type PDFArray,
  type RGB,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export interface ResumePhoto {
  data: Uint8Array;
  kind: "png" | "jpg";
}

export interface ResumeProfile {
  name: string;
  title: string;
  bio: string;
  email: string;
  phone: string;
  githubUrl: string;
  linkedinUrl: string;
  whatsappUrl: string;
  dateOfBirth: string;
  gender: string;
  address: string;
}

export interface ResumeItem {
  title: string;
  description: string;
  tags: string[];
  docUrl?: string | null; // project dossier URL — shown as a "See Doc" link when set
}

export interface ResumeCareerItem {
  title: string;
  place: string;
  description: string;
  startDate: string;
  endDate: string | null;
}

export interface ResumeSkillGroup {
  category: string;
  skills: string[];
}

export interface ResumeData {
  profile: ResumeProfile | null;
  photo: ResumePhoto | null;
  projects: ResumeItem[];
  developingProjects: ResumeItem[];
  experience: ResumeCareerItem[];
  education: ResumeCareerItem[];
  skills: ResumeSkillGroup[];
}

const PAGE = { width: 595.28, height: 841.89 }; // A4
const SIDEBAR_W = PAGE.width * 0.3;
const SIDE = { x: 30, right: SIDEBAR_W - 10, top: 30 }; // mirrors the old paddings
const SIDE_W = SIDE.right - SIDE.x;
const MAIN = { x: SIDEBAR_W + 25, right: PAGE.width - 40, top: 35 };
const MAIN_W = MAIN.right - MAIN.x;
const BOTTOM = 30;

const SIDEBAR_BG = rgb(0.957, 0.965, 0.973); // #f4f6f8
const PILL_MAIN_BG = rgb(0.941, 0.957, 0.973); // #f0f4f8
const PILL_SIDE_BG = rgb(0.886, 0.909, 0.941); // #e2e8f0
const ACCENT = rgb(0.075, 0.498, 0.925); // #137fec
const DARK = rgb(0.102, 0.137, 0.196); // #1a2332
const TEXT = rgb(0.2, 0.2, 0.2); // #333
const BODY = rgb(0.267, 0.267, 0.267); // #444
const SUBTLE = rgb(0.333, 0.333, 0.333); // #555
const LABEL = rgb(0.4, 0.4, 0.4); // #666
const RULE = rgb(0.82, 0.835, 0.859); // #d1d5db

// pdf-lib custom-font embedding maps glyphs via the font itself, but keep the
// CMS text within Roboto's subset (latin + bullet) — drop anything else.
const REPLACEMENTS: Record<string, string> = {
  "\u2014": "-",
  "\u2013": "-",
  "\u2018": "'",
  "\u2019": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u2026": "...",
  "\u00B7": "-",
  "\u2192": "->",
  "\u2705": "[done]",
  "\u2713": "[ok]",
};

function sanitize(text: unknown): string {
  const raw = typeof text === "string" ? text : "";
  let out = "";
  for (const ch of raw.replace(/\r/g, "")) {
    if (REPLACEMENTS[ch] !== undefined) out += REPLACEMENTS[ch];
    else if (ch >= " " && ch <= "~") out += ch;
    else if (ch >= "\u00A0" && ch <= "\u00FF") out += ch; // latin-1 lives in the subset
    else if (ch === "\u2022") out += ch;
    // everything else is dropped
  }
  return out;
}

function ageFrom(dob: string): string {
  const m = dob.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!m) return "";
  const born = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(born.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age--;
  return age >= 0 && age < 130 ? String(age) : "";
}

function textWidth(font: PDFFont, size: number, text: string): number {
  return font.widthOfTextAtSize(text, size);
}

// pdf-lib has no high-level link API — attach a raw /Link annotation
function addLink(
  pdf: PDFDocument,
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  url: string,
) {
  const { context } = pdf;
  const annot = context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [x, y, x + w, y + h],
    Border: [0, 0, 0],
    A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
  });
  const ref = context.register(annot);
  const annots = page.node.get(PDFName.of("Annots"));
  if (annots) (annots as PDFArray).push(ref);
  else page.node.set(PDFName.of("Annots"), context.obj([ref]));
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidth(font, size, candidate) <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

// linkedin/github handle out of a profile URL (port of the original helper)
function socialHandle(url: string, platform: "linkedin" | "github"): string {
  if (!url) return "";
  const pick = (path: string): string => {
    const parts = path.split("/").filter(Boolean) as string[];
    if (!parts.length) return "";
    if (platform === "linkedin") {
      const sections = ["in", "company", "school", "pub"];
      if (sections.includes(parts[0] ?? "") && parts[1]) return parts[1];
      return parts[parts.length - 1] ?? "";
    }
    if (platform === "github") return parts[0] || parts[parts.length - 1] || "";
    return parts[parts.length - 1] ?? "";
  };
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return pick(parsed.pathname);
  } catch {
    return pick(url);
  }
}

// circle as four bezier segments, ending with the clip operators so a
// following drawImage is clipped to the circle
function circleClipOps(cx: number, cy: number, r: number) {
  const k = r * 0.5523;
  return [
    pushGraphicsState(),
    moveTo(cx + r, cy),
    appendBezierCurve(cx + r, cy + k, cx + k, cy + r, cx, cy + r),
    appendBezierCurve(cx - k, cy + r, cx - r, cy + k, cx - r, cy),
    appendBezierCurve(cx - r, cy - k, cx - k, cy - r, cx, cy - r),
    appendBezierCurve(cx + k, cy - r, cx + r, cy - k, cx + r, cy),
    closePath(),
    clip(),
    endPath(),
  ];
}

async function embedPhoto(pdf: PDFDocument, photo: ResumePhoto): Promise<PDFImage | null> {
  try {
    return photo.kind === "png" ? await pdf.embedPng(photo.data) : await pdf.embedJpg(photo.data);
  } catch {
    return null; // unsupported bytes (gif/webp/corrupt) — just skip the photo
  }
}

// Roboto lives on cdnjs — fetched once per isolate and reused across renders.
const FONT_URLS = {
  regular: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
  bold: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
} as const;
const fontCache = new Map<string, Uint8Array>();

async function loadFont(kind: keyof typeof FONT_URLS): Promise<Uint8Array | null> {
  const cached = fontCache.get(kind);
  if (cached) return cached;
  try {
    const res = await fetch(FONT_URLS[kind]);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    fontCache.set(kind, bytes);
    return bytes;
  } catch {
    return null;
  }
}

export async function buildResumePdf(data: ResumeData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  let regular: PDFFont;
  let bold: PDFFont;
  const [robotoRegular, robotoBold] = await Promise.all([loadFont("regular"), loadFont("bold")]);
  if (robotoRegular && robotoBold) {
    pdf.registerFontkit(fontkit);
    regular = await pdf.embedFont(robotoRegular, { subset: true });
    bold = await pdf.embedFont(robotoBold, { subset: true });
  } else {
    regular = await pdf.embedFont(StandardFonts.Helvetica);
    bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  }

  const addPage = () => {
    const page = pdf.addPage([PAGE.width, PAGE.height]);
    page.drawRectangle({ x: 0, y: 0, width: SIDEBAR_W, height: PAGE.height, color: SIDEBAR_BG });
    return page;
  };
  let page: PDFPage = addPage();
  let y = PAGE.height - MAIN.top;

  const ensureSpace = (needed: number) => {
    if (y - needed < BOTTOM) {
      page = addPage();
      y = PAGE.height - MAIN.top;
    }
  };

  // text with per-character tracking (the old design tracks the name/title)
  const drawTracked = (
    text: string,
    x: number,
    baselineY: number,
    size: number,
    font: PDFFont,
    color: RGB,
    tracking: number,
  ) => {
    let cx = x;
    for (const ch of text) {
      page.drawText(ch, { x: cx, y: baselineY, size, font, color });
      cx += textWidth(font, size, ch) + tracking;
    }
  };
  const trackedWidth = (text: string, size: number, font: PDFFont, tracking: number) =>
    text ? textWidth(font, size, text) + tracking * (text.length - 1) : 0;
  const wrapTracked = (text: string, size: number, font: PDFFont, tracking: number, maxWidth: number) => {
    const lines: string[] = [];
    for (const word of sanitize(text).toUpperCase().split(/\s+/).filter(Boolean)) {
      const line = lines[lines.length - 1];
      const candidate = line ? `${line} ${word}` : word;
      if (trackedWidth(candidate, size, font, tracking) <= maxWidth) {
        if (line) lines[lines.length - 1] = candidate;
        else lines.push(candidate);
      } else {
        lines.push(word);
      }
    }
    return lines;
  };

  // single line stretched to the column width (text-align: justify); the last
  // line of a block is left as-is
  const drawStretched = (
    line: string,
    x: number,
    baselineY: number,
    width: number,
    font: PDFFont,
    size: number,
    color: RGB,
  ) => {
    const words = line.split(" ");
    if (words.length < 2) {
      page.drawText(line, { x, y: baselineY, size, font, color });
      return;
    }
    const wordsW = words.reduce((sum, word) => sum + textWidth(font, size, word), 0);
    const gap = (width - wordsW) / (words.length - 1);
    let cx = x;
    for (const word of words) {
      page.drawText(word, { x: cx, y: baselineY, size, font, color });
      cx += textWidth(font, size, word) + gap;
    }
  };

  const drawWrapped = (
    text: string,
    x: number,
    maxWidth: number,
    font: PDFFont,
    size: number,
    color: RGB,
    lineH: number,
    justify = false,
  ) => {
    const lines = wrap(sanitize(text), font, size, maxWidth);
    lines.forEach((line, i) => {
      ensureSpace(lineH);
      const last = i === lines.length - 1;
      if (justify && !last) drawStretched(line, x, y - size, maxWidth, font, size, color);
      else page.drawText(line, { x, y: y - size, size, font, color });
      y -= lineH;
    });
  };

  const sectionTitle = (label: string) => {
    ensureSpace(40);
    y -= 12;
    page.drawText(sanitize(label).toUpperCase(), {
      x: MAIN.x,
      y: y - 13,
      size: 13,
      font: bold,
      color: ACCENT,
    });
    y -= 13;
    y -= 10;
  };

  const pill = (
    text: string,
    x: number,
    yTop: number,
    fg: RGB,
    bg: RGB,
    size: number,
    pad: number,
  ) => {
    const w = textWidth(regular, size, text) + pad * 2;
    const h = 12;
    page.drawRectangle({ x, y: yTop - h, width: w, height: h, color: bg });
    page.drawText(sanitize(text), { x: x + pad, y: yTop - h + 3.5, size, font: regular, color: fg });
    return w;
  };

  // item row: bold title left, accent label right (See Doc / dates)
  const itemHeader = (title: string, rightText: string, rightBold = false, rightUrl?: string) => {
    ensureSpace(26);
    const heading = sanitize(title);
    page.drawText(heading, { x: MAIN.x, y: y - 10, size: 10, font: bold, color: DARK });
    if (rightText) {
      const rt = sanitize(rightText);
      const rw = textWidth(regular, 8, rt);
      const rx = MAIN.right - rw;
      if (rx > MAIN.x + textWidth(bold, 10, heading) + 12) {
        page.drawText(rt, {
          x: rx,
          y: y - 9,
          size: 8,
          font: rightBold ? bold : regular,
          color: ACCENT,
        });
        if (rightUrl) {
          page.drawLine({
            start: { x: rx, y: y - 10.5 },
            end: { x: rx + rw, y: y - 10.5 },
            thickness: 0.5,
            color: ACCENT,
          });
          addLink(pdf, page, rx - 2, y - 12, rw + 4, 12, rightUrl);
        }
      }
    }
    y -= 14;
  };
  const itemSubtitle = (text: string) => {
    if (!text) return;
    page.drawText(sanitize(text), { x: MAIN.x, y: y - 9, size: 9, font: bold, color: SUBTLE });
    y -= 12;
  };
  const itemDescription = (text: string) => {
    if (!text) return;
    drawWrapped(text, MAIN.x, MAIN_W, regular, 8.5, BODY, 11.9, true);
  };

  const projectSection = (label: string, items: ResumeItem[]) => {
    if (!items.length) return;
    sectionTitle(label);
    y -= 4.5; // matches the original's section-to-first-item rhythm
    for (const project of items) {
      ensureSpace(30);
      itemHeader(project.title, project.docUrl ? "See Doc" : "", false, project.docUrl ?? undefined);
      itemDescription(project.description);
      const tags = project.tags.slice(0, 5);
      if (tags.length) {
        y -= 3; // drop below the last description baseline (y sits 3.4 under it)
        let rowX = MAIN.x;
        ensureSpace(12);
        const top = y;
        for (const tag of tags) {
          const w = textWidth(regular, 7, sanitize(tag)) + 10;
          if (rowX + w > MAIN.right) break;
          pill(tag, rowX, top, LABEL, PILL_MAIN_BG, 7, 5);
          rowX += w + 4;
        }
        y -= 12;
      }
      y -= 11;
    }
  };

  const p = data.profile;

  // ---- sidebar (first page only; drawn before the main column flows) ----
  const sx = SIDE.x;
  let sy = PAGE.height - SIDE.top;

  const sideStep = (n: number) => {
    if (sy - n < 40) sy = -1; // out of sidebar room — stop drawing
    else sy -= n;
  };
  const sideSectionTitle = (label: string) => {
    if (sy < 40) return;
    sideStep(12); // section top gap — double the in-section 6pt rhythm
    if (sy < 0) return;
    page.drawText(sanitize(label).toUpperCase(), {
      x: sx,
      y: sy - 11,
      size: 11,
      font: bold,
      color: DARK,
    });
    sy -= 11;
    sy -= 6;
    page.drawLine({
      start: { x: sx, y: sy },
      end: { x: SIDE.right, y: sy },
      thickness: 1,
      color: RULE,
    });
    sy -= 1;
    sideStep(5);
  };
  const sideInfoRow = (label: string, valueLines: string[], linkUrl?: string) => {
    if (!valueLines.length) return;
    sideStep(7);
    if (sy < 0) return;
    page.drawText(sanitize(label), { x: sx, y: sy - 8, size: 7.5, font: bold, color: SUBTLE });
    let first = true;
    for (const line of valueLines) {
      sideStep(10);
      if (sy < 0) return;
      const text = sanitize(line);
      const isLink = first && linkUrl;
      page.drawText(text, {
        x: sx,
        y: sy - 8,
        size: 8,
        font: regular,
        color: isLink ? ACCENT : TEXT,
      });
      if (isLink) {
        const w = textWidth(regular, 8, text);
        page.drawLine({
          start: { x: sx, y: sy - 9.5 },
          end: { x: sx + w, y: sy - 9.5 },
          thickness: 0.5,
          color: ACCENT,
        });
        addLink(pdf, page, sx, sy - 10, w, 11, linkUrl);
      }
      first = false;
    }
    sideStep(8); // blank-line gap between info groups
  };

  const photo = data.photo ? await embedPhoto(pdf, data.photo) : null;
  if (photo) {
    const size = 100;
    const cx = sx + SIDE_W / 2;
    const cy = PAGE.height - SIDE.top - size / 2;
    const scale = Math.max(size / photo.width, size / photo.height); // center-crop cover
    page.pushOperators(...circleClipOps(cx, cy, size / 2));
    page.drawImage(photo, {
      x: cx - (photo.width * scale) / 2,
      y: cy - (photo.height * scale) / 2,
      width: photo.width * scale,
      height: photo.height * scale,
    });
    page.pushOperators(popGraphicsState());
    // subtle light ring hugging the clipped photo edge (r=50)
    page.drawCircle({ x: cx, y: cy, size: 51.2, borderColor: rgb(1, 1, 1), borderWidth: 1.2 });
    sy = cy - size / 2 - 20;
  }

  const age = ageFrom(p?.dateOfBirth ?? "");
  sideSectionTitle("Personal Info");
  if (p?.dateOfBirth) sideInfoRow("Date of Birth", [p.dateOfBirth]);
  if (age) sideInfoRow("Age", [`${age} years`]);
  if (p?.gender) sideInfoRow("Gender", [p.gender]);

  sideSectionTitle("Contact");
  if (p?.phone) sideInfoRow("Phone", [p.phone]);
  if (p?.email) sideInfoRow("Email", wrap(p.email, regular, 8, SIDE_W));
  if (p?.address) sideInfoRow("Address", wrap(p.address, regular, 8, SIDE_W));
  if (p?.whatsappUrl) {
    const number = p.whatsappUrl.split("/").filter(Boolean).pop() ?? "";
    if (number) sideInfoRow("WhatsApp", [number], p.whatsappUrl);
  }
  const linkedinHandle = socialHandle(p?.linkedinUrl ?? "", "linkedin");
  if (p?.linkedinUrl) sideInfoRow("LinkedIn", [linkedinHandle || "LinkedIn Profile"], p.linkedinUrl);
  const githubHandle = socialHandle(p?.githubUrl ?? "", "github");
  if (p?.githubUrl) sideInfoRow("GitHub", [githubHandle || "GitHub Profile"], p.githubUrl);

  if (data.skills.length) {
    sideSectionTitle("Skills");
    sideStep(3); // same rule-to-content gap as the other sidebar sections
    for (const group of data.skills) {
      if (sy < 40) break;
      if (sy < 0) break;
      page.drawText(sanitize(group.category), {
        x: sx,
        y: sy - 9,
        size: 9,
        font: bold,
        color: ACCENT,
      });
      sy -= 9;
      sideStep(7); // pill row starts below the category baseline
      if (sy < 0) break;
      // tag pills, wrapping rows with a 3pt gap
      let rowX = sx;
      for (const skill of group.skills) {
        const w = textWidth(regular, 7, sanitize(skill)) + 10;
        if (w > SIDE_W) continue; // pill wider than the column — skip it
        if (rowX + w > SIDE.right) {
          sy -= 15; // pill height + row gap
          rowX = sx;
        }
        if (sy < 40) break;
        pill(skill, rowX, sy, BODY, PILL_SIDE_BG, 7, 5);
        rowX += w + 3;
      }
      sideStep(15 + 8); // blank-line gap between skill categories
      if (sy < 0) break;
    }
  }

  // ---- main column: header ----
  const nameLines = wrapTracked(p?.name || "Resume", 22, bold, 1.25, MAIN_W);
  for (const line of nameLines) {
    drawTracked(line, MAIN.x, y - 22, 22, bold, DARK, 1.25);
    y -= 26;
  }
  y -= 4;
  if (p?.title) {
    drawTracked(sanitize(p.title).toUpperCase(), MAIN.x, y - 11, 11, bold, ACCENT, 0.5);
  }
  y -= 11;
  y -= 14; // paddingBottom before the accent header rule
  page.drawLine({
    start: { x: MAIN.x, y },
    end: { x: MAIN.right, y },
    thickness: 2,
    color: ACCENT,
  });
  y -= 4;

  // ---- main column: sections (order matches the original design) ----
  if (p?.bio) {
    sectionTitle("Profile");
    drawWrapped(p.bio, MAIN.x, MAIN_W, regular, 9, BODY, 13.5, true);
  }

  projectSection("Key Project", data.projects);
  projectSection("Developing Projects", data.developingProjects);

  if (data.experience.length) {
    sectionTitle("Experience");
    y -= 4.5;
    for (const exp of data.experience) {
      ensureSpace(30);
      itemHeader(exp.title, [exp.startDate, exp.endDate || "Present"].filter(Boolean).join(" - "), true);
      itemSubtitle(exp.place);
      itemDescription(exp.description);
      y -= 10;
    }
  }

  if (data.education.length) {
    sectionTitle("Education");
    y -= 4.5;
    for (const edu of data.education) {
      ensureSpace(30);
      itemHeader(edu.title, [edu.startDate, edu.endDate || "Present"].filter(Boolean).join(" - "), true);
      itemSubtitle(edu.place);
      itemDescription(edu.description);
      y -= 10;
    }
  }

  return pdf.save();
}
