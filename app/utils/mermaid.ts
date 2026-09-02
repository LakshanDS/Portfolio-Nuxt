import type Mermaid from "mermaid";

// mermaid is a ~5 MB browser-only library — importing it statically drags
// it into the worker bundle (over Cloudflare's size limit), so it is
// loaded lazily on the client only. Shared by the docs renderer and the
// editor preview so both render with the same theme.
let mermaidPromise: Promise<typeof Mermaid> | null = null;
const svgCache = new Map<string, string>();
let renderCount = 0;

export async function loadMermaid(): Promise<typeof Mermaid> {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((mod) => {
      mod.default.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          darkMode: true,
          background: "#0A0A0B",
          fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
          fontSize: "14px",
          // nodes — dark navy cards on near-black (flowchart paints node fill
          // from mainBkg, not primaryColor)
          primaryColor: "#1B3B5F",
          primaryTextColor: "#F2F5F9",
          primaryBorderColor: "#2C5B8F",
          nodeBorder: "#2C5B8F",
          mainBkg: "#1B3B5F",
          // subgraphs — subtle gray panels
          clusterBkg: "#1A1A1D",
          clusterBorder: "#2A2A2E",
          titleColor: "#D9DDE3",
          // edges + labels
          lineColor: "#C6CDD5",
          edgeLabelBackground: "#101114",
          textColor: "#F2F5F9",
          secondaryColor: "#1A1A1D",
          tertiaryColor: "#141416",
          // sequence diagrams
          actorBkg: "#1B3B5F",
          actorBorder: "#2C5B8F",
          actorTextColor: "#F2F5F9",
          actorLineColor: "#3A3F46",
          signalColor: "#C6CDD5",
          signalTextColor: "#C7CDD6",
          labelBoxBkgColor: "#1B3B5F",
          labelBoxBorderColor: "#2C5B8F",
          labelTextColor: "#F2F5F9",
          loopTextColor: "#C7CDD6",
          noteBkgColor: "#26282E",
          noteBorderColor: "#3A3D45",
          noteTextColor: "#F2F5F9",
        },
        flowchart: {
          htmlLabels: true,
          // mermaid's default smooth splines — step/rounded routing turns
          // messy with dagre's sparse anchor points (staircases, stray labels)
          curve: "basis",
          padding: 16,
          nodeSpacing: 60,
          rankSpacing: 70,
          // scale down to fit the container — the full diagram stays visible
          // instead of spilling into a horizontal scroll
          useMaxWidth: true,
        },
        sequence: { useMaxWidth: true },
      });
      return mod.default;
    });
  }
  return mermaidPromise;
}

/** Render a chart to svg (cached by chart text). Throws on parse errors. */
export async function renderMermaidSvg(chart: string): Promise<string> {
  const cached = svgCache.get(chart);
  if (cached) return cached;
  const mermaid = await loadMermaid();
  const id = `m-${renderCount++}`;
  const { svg } = await mermaid.render(id, chart);
  const routed = routeFlowchartEdges(svg, chart, id);
  svgCache.set(chart, routed);
  return routed;
}

// dagre anchors edges where the center-to-center line crosses the node border,
// so verticals leave from node corners and arrows land on target sides. Reroute
// every flowchart edge through the gutter between the two nodes: verticals
// attach to top/bottom centers, horizontals to left/right centers, parallel
// lines on one side fan out with even spacing, corners rounded.
function routeFlowchartEdges(svg: string, chart: string, renderId: string): string {
  const horizontalChart = !/\b(?:flowchart|graph)\s+(?:TB|TD)\b/.test(chart);
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");

  // node geometry: g#<renderId>-flowchart-<id>-<n> is translated to the node
  // center with its rect centered on the origin
  type Rect = { cx: number; cy: number; hw: number; hh: number };
  const nodes = new Map<string, Rect>();
  const nodePrefix = `${renderId}-flowchart-`;
  for (const g of Array.from(doc.querySelectorAll("g.node"))) {
    const t = /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/.exec(g.getAttribute("transform") ?? "");
    const rect = g.querySelector("rect");
    if (!g.id.startsWith(nodePrefix) || !t || !rect) continue;
    nodes.set(g.id.slice(nodePrefix.length).replace(/-\d+$/, ""), {
      cx: parseFloat(t[1]),
      cy: parseFloat(t[2]),
      hw: parseFloat(rect.getAttribute("width") ?? "0") / 2,
      hh: parseFloat(rect.getAttribute("height") ?? "0") / 2,
    });
  }

  // edge ids look like <renderId>-L_<src>_<tgt>_<n>; ids may contain
  // underscores so match against known node ids (longest first)
  const byLen = Array.from(nodes.keys()).sort((a, b) => b.length - a.length);
  const parseEnds = (id: string): [string | null, string | null] => {
    if (!id.startsWith(`${renderId}-L_`)) return [null, null];
    const e = id.slice(renderId.length + 3);
    for (const s of byLen) {
      if (!e.startsWith(`${s}_`)) continue;
      const rest = e.slice(s.length + 1);
      for (const t of byLen) {
        if (rest.startsWith(`${t}_`) && /^\d+$/.test(rest.slice(t.length + 1))) return [s, t];
      }
    }
    return [null, null];
  };

  type Edge = {
    path: Element;
    x0: number; y0: number; x1: number; y1: number;
    sSide?: string; tSide?: string;
    sx?: number; sy?: number; tx?: number; ty?: number;
    channel?: number;
  };
  const edges: Edge[] = [];
  const groups = new Map<string, { edge: Edge; isSource: boolean; coord: number }[]>();
  const push = (edge: Edge, nodeId: string, side: string, isSource: boolean, coord: number) => {
    if (isSource) edge.sSide = side;
    else edge.tSide = side;
    const key = `${nodeId}|${side}`;
    const list = groups.get(key) ?? [];
    list.push({ edge, isSource, coord });
    groups.set(key, list);
  };

  for (const path of Array.from(doc.querySelectorAll("path.flowchart-link"))) {
    const d = path.getAttribute("d");
    if (!d) continue;
    const n = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    if (n.length < 4) continue;
    const [sId, tId] = parseEnds(path.id);
    if (sId && sId === tId) continue; // self loop — keep mermaid's path
    const src = sId ? nodes.get(sId) : undefined;
    const tgt = tId ? nodes.get(tId) : undefined;
    const e: Edge = {
      path, x0: n[0], y0: n[1], x1: n[n.length - 2], y1: n[n.length - 1],
    };
    if (horizontalChart) {
      if (src && tgt) {
        const spread = Math.abs(tgt.cx - src.cx) >= (src.hw + tgt.hw) * 0.6;
        if (spread) {
          const right = tgt.cx > src.cx;
          push(e, sId!, right ? "right" : "left", true, tgt.cy);
          push(e, tId!, right ? "left" : "right", false, src.cy);
        } else {
          const below = tgt.cy > src.cy;
          push(e, sId!, below ? "bottom" : "top", true, tgt.cx);
          push(e, tId!, below ? "top" : "bottom", false, src.cx);
        }
      } else if (src) {
        push(e, sId!, e.x1 >= src.cx ? "right" : "left", true, e.y1);
      } else if (tgt) {
        push(e, tId!, e.x0 <= tgt.cx ? "left" : "right", false, e.y0);
      }
    } else {
      if (src && tgt) {
        const stacked = Math.abs(tgt.cy - src.cy) >= (src.hh + tgt.hh) * 0.6;
        if (stacked) {
          const down = tgt.cy > src.cy;
          push(e, sId!, down ? "bottom" : "top", true, tgt.cx);
          push(e, tId!, down ? "top" : "bottom", false, src.cx);
        } else {
          const rightOf = tgt.cx > src.cx;
          push(e, sId!, rightOf ? "right" : "left", true, tgt.cy);
          push(e, tId!, rightOf ? "left" : "right", false, src.cy);
        }
      } else if (src) {
        push(e, sId!, e.y1 >= src.cy ? "bottom" : "top", true, e.x1);
      } else if (tgt) {
        push(e, tId!, e.y0 <= tgt.cy ? "top" : "bottom", false, e.x0);
      }
    }
    edges.push(e);
  }

  // side-center anchors, evenly fanned out per node side; edges that leave a
  // node get a staggered channel so parallel lines don't overlap
  for (const [key, members] of Array.from(groups)) {
    const [nodeId, side] = key.split("|");
    const r = nodes.get(nodeId);
    if (!r) continue;
    const verticalSide = side === "top" || side === "bottom";
    members.sort((a, b) => a.coord - b.coord);
    const step = members.length > 1
      ? Math.min(24, ((verticalSide ? r.hw : r.hh) * 2 - 16) / (members.length - 1))
      : 0;
    members.forEach((m, i) => {
      const off = (i - (members.length - 1) / 2) * step;
      const e = m.edge;
      if (side === "bottom") {
        if (m.isSource) { e.sx = r.cx + off; e.sy = r.cy + r.hh; }
        else { e.tx = r.cx + off; e.ty = r.cy + r.hh + 4; }
      } else if (side === "top") {
        if (m.isSource) { e.sx = r.cx + off; e.sy = r.cy - r.hh; }
        else { e.tx = r.cx + off; e.ty = r.cy - r.hh - 4; }
      } else if (side === "right") {
        if (m.isSource) { e.sx = r.cx + r.hw; e.sy = r.cy + off; }
        else { e.tx = r.cx + r.hw + 4; e.ty = r.cy + off; }
      } else {
        if (m.isSource) { e.sx = r.cx - r.hw; e.sy = r.cy + off; }
        else { e.tx = r.cx - r.hw - 4; e.ty = r.cy + off; }
      }
    });
  }

  // spread each node's outgoing channels evenly through the available gutter
  // (25%–75% of each edge's own span) so parallel lines don't bunch together
  for (const [, members] of Array.from(groups)) {
    const exits = members.filter((m) => m.isSource && m.edge.ty !== undefined && m.edge.tx !== undefined);
    if (exits.length < 2) continue;
    exits.sort((a, b) => a.coord - b.coord);
    const vert = exits[0].edge.sSide === "top" || exits[0].edge.sSide === "bottom";
    const n = exits.length;
    exits.forEach((m, i) => {
      const e = m.edge;
      const t = 0.25 + (0.5 * i) / (n - 1);
      e.channel = vert ? e.y0 + t * (e.ty! - e.y0) : e.x0 + t * (e.tx! - e.x0);
    });
  }

  for (const e of edges) {
    const sx = e.sx ?? e.x0;
    const sy = e.sy ?? e.y0;
    const tx = e.tx ?? e.x1;
    const ty = e.ty ?? e.y1;
    const sVert = e.sSide === "top" || e.sSide === "bottom";
    const tVert = e.tSide === "top" || e.tSide === "bottom";
    const vert = e.sSide || e.tSide ? sVert || tVert : !horizontalChart;
    e.path.setAttribute("d", zRoute(sx, sy, tx, ty, 10, !vert, e.channel));
  }
  return new XMLSerializer().serializeToString(doc);
}

function zRoute(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  horizontal: boolean,
  channel?: number,
): string {
  const f = (v: number) => String(Math.round(v * 100) / 100);
  if (Math.abs(x0 - x1) < 0.5 && Math.abs(y0 - y1) < 0.5) return `M ${f(x0)},${f(y0)} L ${f(x1)},${f(y1)}`;
  if (horizontal) {
    // horizontal → vertical → horizontal around the mid-x gutter
    if (Math.abs(y0 - y1) < 0.5) return `M ${f(x0)},${f(y0)} L ${f(x1)},${f(y1)}`;
    const xm = channel ?? x0 + (x1 - x0) / 2;
    const dx = Math.sign(x1 - x0);
    const dy = Math.sign(y1 - y0);
    const c1 = Math.min(r, Math.abs(xm - x0), Math.abs(y1 - y0) / 2);
    const c2 = Math.min(r, Math.abs(x1 - xm), Math.abs(y1 - y0) / 2);
    return [
      `M ${f(x0)},${f(y0)}`,
      `L ${f(xm - dx * c1)},${f(y0)}`,
      `Q ${f(xm)},${f(y0)} ${f(xm)},${f(y0 + dy * c1)}`,
      `L ${f(xm)},${f(y1 - dy * c2)}`,
      `Q ${f(xm)},${f(y1)} ${f(xm + dx * c2)},${f(y1)}`,
      `L ${f(x1)},${f(y1)}`,
    ].join(" ");
  }
  // vertical → horizontal → vertical around the mid-y gutter
  if (Math.abs(x0 - x1) < 0.5) return `M ${f(x0)},${f(y0)} L ${f(x1)},${f(y1)}`;
  const ym = channel ?? y0 + (y1 - y0) / 2;
  const dy = Math.sign(y1 - y0) || 1;
  const dx = Math.sign(x1 - x0);
  const c1 = Math.min(r, Math.abs(ym - y0), Math.abs(x1 - x0) / 2);
  const c2 = Math.min(r, Math.abs(y1 - ym), Math.abs(x1 - x0) / 2);
  return [
    `M ${f(x0)},${f(y0)}`,
    `L ${f(x0)},${f(ym - dy * c1)}`,
    `Q ${f(x0)},${f(ym)} ${f(x0 + dx * c1)},${f(ym)}`,
    `L ${f(x1 - dx * c2)},${f(ym)}`,
    `Q ${f(x1)},${f(ym)} ${f(x1)},${f(ym + dy * c2)}`,
    `L ${f(x1)},${f(y1)}`,
  ].join(" ");
}
