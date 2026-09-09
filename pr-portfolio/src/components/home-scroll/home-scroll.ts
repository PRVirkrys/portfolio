import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  desktopBounds,
  parseSnapshot,
  progressFor,
  snapshotAt,
  type Bounds,
  type Snapshot,
} from "./home-progress";
import { homeCopy, type HomeCopy, type Locale } from "./home-copy";
import { splitFlapStateAt } from "./split-flap";

gsap.registerPlugin(ScrollTrigger);
const SEEN = "paula-home-intro-v1";
const SAVED = "paula-home-position-v1";
// The intro (line → wipe → logo → UI) is the opening slice of the same scrubbed
// timeline as the rest, so scroll drives and reverses it. INTRO is its length in
// timeline units; the main story keeps its own span after it, and `total` (built
// once the main timeline exists) is the whole thing intro + main.
const INTRO = 0.14;
// Scroll length of the pinned journey, in viewport heights. Tuned by feel; the
// GSAP beat positions are proportions of the main timeline, not of this. Raised
// with the longer intro narrative (text boxes → ribbon → purpose phrase).
const SCREENS = 22;
const read = (key: string) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* Private browsing still gets a usable page. */
  }
};
let dispose: (() => void) | undefined;
let currentRoot: HTMLElement | null = null;
let installed = false;

function measureConnections(root: HTMLElement) {
  const map = root.querySelector<HTMLElement>('[data-motion="board-map"]')!;
  const cards = Object.fromEntries(
    [...map.querySelectorAll<HTMLElement>("[data-node]")].map((n) => [
      n.dataset.node!,
      n,
    ]),
  );
  const box = (id: string) => {
    const n = cards[id];
    return {
      x: n.offsetLeft,
      y: n.offsetTop,
      w: n.offsetWidth,
      h: n.offsetHeight,
    };
  };
  for (const path of map.querySelectorAll<SVGPathElement>("[data-edge]")) {
    const edge = path.dataset.edge!;
    const [from, to] =
      edge === "draft" ? ["needs", "product"] : edge.split("-");
    const a = box(from),
      b = box(to);
    const horizontal = Math.abs(a.y - b.y) < 10;
    const sx = horizontal ? a.x + a.w : a.x + a.w / 2;
    const sy = horizontal ? a.y + a.h / 2 : a.y + a.h;
    const ex = horizontal ? b.x : b.x + b.w / 2;
    const ey = horizontal ? b.y + b.h / 2 : b.y;
    const middle = (sy + ey) / 2;
    path.setAttribute(
      "d",
      horizontal
        ? `M${sx},${sy} H${ex}`
        : `M${sx},${sy} V${middle} H${ex} V${ey}`,
    );
  }
}

// The greeting: three Figma "Container text mark" boxes appear and are typed
// glyph by glyph (each `.text-mark__char` grows from width 0, so the box grows
// and the blinking caret rides the last glyph), then the three are selected
// together, their gap is tightened, and the selection clears. Every state is a
// tween on `main`, so scrubbing backwards replays it exactly — no textContent
// is swapped. Cursor rest points are measured from the laid-out composition.
function animateGreeting(
  root: HTMLElement,
  tl: gsap.core.Timeline,
  start: number,
  span: number,
  copy: HomeCopy,
) {
  const layoutEl = root.querySelector<HTMLElement>(".home-greeting__layout");
  const marksWrap = root.querySelector<HTMLElement>("[data-greeting-marks]");
  const marks = marksWrap
    ? [...marksWrap.querySelectorAll<HTMLElement>(".greeting-mark")]
    : [];
  const group = root.querySelector<HTMLElement>("[data-greeting-group]");
  const cursor = root.querySelector<HTMLElement>(".narrative-cursor--greeting");
  const msgEl = cursor?.querySelector<HTMLElement>("[data-cursor-msg]") ?? null;
  if (!layoutEl || !marksWrap || marks.length < 3 || !group || !cursor) return;
  if (msgEl) msgEl.textContent = copy.intro.cursorShort;

  const base = layoutEl.getBoundingClientRect();
  const rel = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
  };
  const m = marks.map(rel);
  // The cursor rides along ~8px under the box's bottom edge: it drops to the
  // start when a box's typing begins, then travels to the end as the glyphs
  // fill in — as if a person were typing into it.
  const UNDER = 8;
  const head = (i: number) => ({ x: m[i].x + 2, y: m[i].y + m[i].h + UNDER });
  const tail = (i: number) => ({ x: m[i].x + m[i].w - 4, y: m[i].y + m[i].h + UNDER });
  const lowerLeft = { x: m[2].x - 10, y: m[2].y + m[2].h + 16 };
  const A = (f: number) => start + f * span;
  const D = (f: number) => f * span;
  const TYPE = 0.11;

  tl.fromTo(
    cursor,
    { autoAlpha: 0, x: head(0).x + 54, y: head(0).y + 48 },
    { autoAlpha: 1, x: head(0).x, y: head(0).y, duration: D(0.06), ease: "power2.out" },
    A(0),
  );

  // Natural glyph widths, measured before anything is hidden.
  const glyphsOf = (mk: HTMLElement) =>
    [...mk.querySelectorAll<HTMLElement>(".text-mark__char")];
  const glyphs = marks.map(glyphsOf);
  const widths = glyphs.map((els) => els.map((e) => e.getBoundingClientRect().width));

  const line = (i: number, appearAt: number, typeAt: number, offAt: number) => {
    tl.fromTo(
      marks[i],
      { autoAlpha: 0, "--sel": 0 },
      { autoAlpha: 1, "--sel": 1, duration: D(0.03) },
      A(appearAt),
    );
    // Snap the cursor to the box's start just before typing, then let it ride
    // rightward with the glyphs over the same window.
    tl.to(
      cursor,
      { x: head(i).x, y: head(i).y, duration: D(0.03), ease: "power1.inOut" },
      A(typeAt - 0.03),
    );
    const chars = glyphs[i];
    const w = widths[i];
    tl.fromTo(
      chars,
      { width: 0 },
      {
        width: (k: number) => w[k],
        duration: 0.001,
        stagger: D(TYPE) / Math.max(1, chars.length),
        ease: "steps(1)",
      },
      A(typeAt),
    );
    tl.to(
      cursor,
      { x: tail(i).x, y: tail(i).y, duration: D(TYPE), ease: "none" },
      A(typeAt),
    );
    tl.to(marks[i], { "--sel": 0, duration: D(0.03) }, A(offAt));
  };
  line(0, 0.03, 0.06, 0.18);
  line(1, 0.21, 0.24, 0.36);
  line(2, 0.39, 0.42, 0.54);

  // Select all three: the cursor jumps to the block's top-left corner, drags to
  // the bottom-right, and the selection box is "drawn" from the corner as it
  // goes (Figma node 16140:22495). Then it settles — handles + ticks — and the
  // line gap tightens with it.
  const bx0 = Math.min(...m.map((v) => v.x));
  const bx1 = Math.max(...m.map((v) => v.x + v.w));
  const by0 = m[0].y;
  const by1 = m[2].y + m[2].h;
  const gap0 = parseFloat(getComputedStyle(marksWrap).gap) || 0;
  const boxW = bx1 - bx0 + 8;
  const boxH = by1 - by0 + 8;
  const boxHTight = Math.max(0, boxH - 2 * gap0);
  const topLeft = { x: bx0 - 8, y: by0 - 10 };
  const botRight = { x: bx1 + 4, y: by1 + 6 };

  gsap.set(group, { left: -4, top: -4 });

  tl.to(
    cursor,
    { x: topLeft.x, y: topLeft.y, duration: D(0.05), ease: "power2.inOut" },
    A(0.55),
  );
  tl.fromTo(
    group,
    { autoAlpha: 0, "--group-sel": 1, "--group-handles": 0, "--group-tick": 0, width: 0, height: 0 },
    { autoAlpha: 1, width: boxW, height: boxH, duration: D(0.13), ease: "none" },
    A(0.61),
  );
  tl.to(
    cursor,
    { x: botRight.x, y: botRight.y, duration: D(0.13), ease: "none" },
    A(0.61),
  );
  tl.to(group, { "--group-handles": 1, "--group-tick": 1, duration: D(0.05) }, A(0.76));
  tl.fromTo(
    marksWrap,
    { "--gap-close": 0 },
    { "--gap-close": 1, duration: D(0.12), ease: "power2.inOut" },
    A(0.78),
  );
  tl.to(group, { height: boxHTight, duration: D(0.12), ease: "power2.inOut" }, A(0.78));
  tl.to(
    cursor,
    { x: lowerLeft.x, y: lowerLeft.y, duration: D(0.09), ease: "power1.inOut" },
    A(0.92),
  );
  tl.to(
    group,
    {
      autoAlpha: 0,
      "--group-sel": 0,
      "--group-handles": 0,
      "--group-tick": 0,
      duration: D(0.05),
    },
    A(0.97),
  );
  if (msgEl)
    tl.fromTo(
      msgEl,
      { "--cursor-msg": 0 },
      { "--cursor-msg": 1, duration: D(0.04) },
      A(0.99),
    );
}

// The transition ribbon: one continuous celeste → rosa stroke whose path is
// built from the measured greeting block and purpose box (so it scales with the
// viewport) and drawn with a single strokeDashoffset tween — reversible.
function animateTransition(
  root: HTMLElement,
  tl: gsap.core.Timeline,
  start: number,
  end: number,
) {
  const svg = root.querySelector<SVGSVGElement>("[data-ribbon]");
  const path = root.querySelector<SVGPathElement>("[data-ribbon-path]");
  const stage = root.querySelector<HTMLElement>(".home-stage");
  const greet = root.querySelector<HTMLElement>(".home-greeting__layout");
  const box = root.querySelector<HTMLElement>(".home-purpose__title");
  if (!svg || !path || !stage || !greet || !box) return;

  const s = stage.getBoundingClientRect();
  const g = greet.getBoundingClientRect();
  const p = box.getBoundingClientRect();
  svg.setAttribute(
    "viewBox",
    `0 0 ${Math.round(s.width)} ${Math.round(s.height)}`,
  );
  const r = Math.min(64, s.width * 0.05);
  const x0 = Math.max(r + 4, g.left - s.left + g.width * 0.26);
  const y0 = g.bottom - s.top + 10;
  const y1 = Math.min(s.height - r - 8, y0 + s.height * 0.3);
  const x1 = s.width - Math.max(40, s.width * 0.06);
  const y2 = Math.max(r + 8, s.height * 0.16);
  const x2 = Math.min(x1 - 2 * r - 4, p.left - s.left + p.width * 0.42);
  const y3 = Math.max(y2 + r, p.top - s.top - 14);
  path.setAttribute(
    "d",
    [
      `M ${x0} ${y0}`,
      `L ${x0} ${y1 - r}`,
      `Q ${x0} ${y1} ${x0 + r} ${y1}`,
      `L ${x1 - r} ${y1}`,
      `Q ${x1} ${y1} ${x1} ${y1 - r}`,
      `L ${x1} ${y2 + r}`,
      `Q ${x1} ${y2} ${x1 - r} ${y2}`,
      `L ${x2 + r} ${y2}`,
      `Q ${x2} ${y2} ${x2} ${y2 + r}`,
      `L ${x2} ${y3}`,
    ].join(" "),
  );
  const len = path.getTotalLength();
  path.style.strokeDasharray = String(len);
  gsap.set(path, { "--ribbon-op": 1 });
  tl.fromTo(
    path,
    { strokeDashoffset: len },
    { strokeDashoffset: 0, duration: end - start, ease: "none" },
    start,
  );
}

// The purpose phrase: a selected Figma box types the sentence, then the cursor
// clicks its emphasis word — a quick pink starburst collapsing into a small
// shape that shifts red → purple as the word itself turns purple. The caret
// stays at the end. Emphasis position is read from the DOM, so it follows the
// language (`forma` / `shape`).
function animatePurpose(
  root: HTMLElement,
  tl: gsap.core.Timeline,
  start: number,
  end: number,
) {
  const stageEl = root.querySelector<HTMLElement>(".home-purpose__stage");
  const box = root.querySelector<HTMLElement>(".home-purpose__title");
  const emph = box?.querySelector<HTMLElement>("[data-emphasis]") ?? null;
  const spark = root.querySelector<HTMLElement>("[data-purpose-spark]");
  const blob = root.querySelector<HTMLElement>("[data-purpose-blob]");
  const cursor = root.querySelector<HTMLElement>(".narrative-cursor--purpose");
  if (!stageEl || !box || !cursor || !spark || !blob) return;
  const span = end - start;

  const base = stageEl.getBoundingClientRect();
  const rel = (el: Element) => {
    const r = el.getBoundingClientRect();
    return {
      x: r.left - base.left + r.width / 2,
      y: r.top - base.top + r.height / 2,
    };
  };
  const hit = rel(emph ?? box);
  const boxC = rel(box);

  // Glyphs typed one by one (box grows one line → two); caret rides the last.
  const chars = [...box.querySelectorAll<HTMLElement>(".text-mark__char")];
  const charW = chars.map((c) => c.getBoundingClientRect().width);

  tl.fromTo(
    box,
    { autoAlpha: 0, y: 16, "--sel": 0, "--emph": 0 },
    { autoAlpha: 1, y: 0, "--sel": 1, duration: span * 0.08, ease: "power2.out" },
    start,
  );
  tl.fromTo(
    chars,
    { width: 0 },
    {
      width: (k: number) => charW[k],
      duration: 0.001,
      stagger: (span * 0.24) / Math.max(1, chars.length),
      ease: "steps(1)",
    },
    start + span * 0.09,
  );

  tl.fromTo(
    cursor,
    {
      autoAlpha: 0,
      x: boxC.x - base.width * 0.4,
      y: boxC.y + base.height + 30,
    },
    { autoAlpha: 1, duration: span * 0.05 },
    start + span * 0.34,
  );
  tl.to(
    cursor,
    { x: hit.x + 6, y: hit.y + 8, duration: span * 0.16, ease: "power2.inOut" },
    start + span * 0.4,
  );

  tl.set([spark, blob], { x: hit.x, y: hit.y }, start);
  tl.fromTo(
    spark,
    { autoAlpha: 0, scale: 0.2, rotate: -25 },
    { autoAlpha: 1, scale: 1, rotate: 0, duration: span * 0.05, ease: "back.out(2)" },
    start + span * 0.6,
  );
  tl.to(
    spark,
    { autoAlpha: 0, scale: 1.6, duration: span * 0.07, ease: "power1.in" },
    start + span * 0.66,
  );
  tl.fromTo(
    blob,
    { autoAlpha: 0, scale: 0 },
    { autoAlpha: 1, scale: 1, duration: span * 0.05, ease: "back.out(1.6)" },
    start + span * 0.64,
  );
  tl.fromTo(
    blob,
    { "--blob-mix": 0 },
    { "--blob-mix": 1, duration: span * 0.1, ease: "none" },
    start + span * 0.7,
  );
  tl.to(
    blob,
    { autoAlpha: 0, scale: 0.5, duration: span * 0.08, ease: "power1.in" },
    start + span * 0.84,
  );
  tl.fromTo(
    box,
    { "--emph": 0 },
    { "--emph": 1, duration: span * 0.12, ease: "none" },
    start + span * 0.7,
  );
}

function animateBoard(
  root: HTMLElement,
  tl: gsap.core.Timeline,
  start: number,
  end: number,
) {
  const q = gsap.utils.selector(root);
  const span = end - start;
  const cards = q("[data-node]");
  const small = innerWidth < 840;
  tl.fromTo(
    cards,
    {
      opacity: 0,
      x: (i: number) => [16, -18, 20, -16, 12][i],
      y: (i: number) => [20, -18, 15, -10, 12][i],
    },
    { opacity: 1, duration: span * 0.15, stagger: span * 0.025 },
    start,
  );
  tl.to(
    cards,
    { x: 0, y: 0, duration: span * 0.25, stagger: span * 0.035 },
    start + span * 0.15,
  );
  const paths = q(
    '[data-edge]:not([data-edge="draft"])',
  ) as unknown as SVGPathElement[];
  paths.forEach((path, i) => {
    const length = path.getTotalLength();
    tl.fromTo(
      path,
      { strokeDasharray: length, strokeDashoffset: length },
      { strokeDashoffset: 0, duration: span * 0.14 },
      start + span * (0.4 + i * 0.065),
    );
  });
  const draft = q('[data-edge="draft"]');
  tl.to(draft, { opacity: 0.65, duration: span * 0.08 }, start + span * 0.45);
  tl.to(draft, { opacity: 0, duration: span * 0.08 }, start + span * 0.61);
  tl.fromTo(
    q('[data-motion="board-selection"]'),
    { opacity: 0, scale: 0.97 },
    { opacity: 1, scale: 1, duration: span * 0.16 },
    start + span * 0.82,
  );
  const cursor = q('[data-motion="board-cursor"]');
  tl.fromTo(
    cursor,
    { opacity: 0, x: small ? -90 : -230, y: -170 },
    { opacity: 1, duration: span * 0.05 },
    start,
  );
  tl.to(
    cursor,
    { x: small ? -30 : -100, y: -230, duration: span * 0.18 },
    start + span * 0.08,
  );
  tl.to(
    cursor,
    { x: small ? -110 : -280, y: -80, duration: span * 0.18 },
    start + span * 0.29,
  );
  tl.to(
    cursor,
    { x: small ? -30 : -40, y: -130, duration: span * 0.17 },
    start + span * 0.5,
  );
  tl.to(cursor, { x: 0, y: 0, duration: span * 0.22 }, start + span * 0.73);
}

// The board frame has become a design-tool window; fill its reading hold by
// assembling it — side panels, then the wireframe built block by block, then
// Paula's cursor landing on an element and a feedback pill confirming a test.
function animateFigma(
  root: HTMLElement,
  tl: gsap.core.Timeline,
  start: number,
  end: number,
) {
  const q = gsap.utils.selector(root);
  const span = end - start;
  tl.fromTo(
    q('[data-motion="figma-layer"]'),
    { autoAlpha: 0, x: -12 },
    { autoAlpha: 1, x: 0, duration: span * 0.1, stagger: span * 0.03 },
    start + span * 0.05,
  );
  tl.fromTo(
    q('[data-motion="figma-block"]'),
    { autoAlpha: 0, y: 14 },
    { autoAlpha: 1, y: 0, duration: span * 0.1, stagger: span * 0.05 },
    start + span * 0.18,
  );
  tl.fromTo(
    q('[data-motion="figma-prop"]'),
    { autoAlpha: 0, x: 12 },
    { autoAlpha: 1, x: 0, duration: span * 0.1, stagger: span * 0.03 },
    start + span * 0.5,
  );
  const cursor = q('[data-motion="figma-cursor"]');
  tl.fromTo(
    cursor,
    { autoAlpha: 0, x: 70, y: 60 },
    { autoAlpha: 1, duration: span * 0.06 },
    start + span * 0.5,
  );
  tl.to(cursor, { x: 0, y: 0, duration: span * 0.22 }, start + span * 0.58);
  tl.fromTo(
    q('[data-motion="figma-feedback"]'),
    { autoAlpha: 0, scale: 0.8, y: 6 },
    { autoAlpha: 1, scale: 1, y: 0, duration: span * 0.1 },
    start + span * 0.82,
  );
}

// The design canvas has become an editor. Fill the hold by assembling it: the
// explorer, the file revealed in two blocks (never keystroke by keystroke), the
// active line lit, the cursor landing on it, then a live preview built up.
function animateCode(
  root: HTMLElement,
  tl: gsap.core.Timeline,
  start: number,
  end: number,
) {
  const q = gsap.utils.selector(root);
  const span = end - start;
  const lines = q('[data-motion="code-line"]');
  const half = Math.ceil(lines.length / 2);
  tl.fromTo(
    q('[data-motion="code-file"]'),
    { autoAlpha: 0, x: -10 },
    { autoAlpha: 1, x: 0, duration: span * 0.1, stagger: span * 0.02 },
    start + span * 0.05,
  );
  tl.fromTo(
    lines.slice(0, half),
    { autoAlpha: 0, y: 8 },
    { autoAlpha: 1, y: 0, duration: span * 0.08, stagger: span * 0.015 },
    start + span * 0.2,
  );
  tl.fromTo(
    lines.slice(half),
    { autoAlpha: 0, y: 8 },
    { autoAlpha: 1, y: 0, duration: span * 0.08, stagger: span * 0.015 },
    start + span * 0.38,
  );
  tl.fromTo(
    q(".code-line[data-active]"),
    { "--code-hl": "0" },
    { "--code-hl": "1", duration: span * 0.12 },
    start + span * 0.52,
  );
  const cursor = q('[data-motion="code-cursor"]');
  tl.fromTo(
    cursor,
    { autoAlpha: 0, x: 40, y: -30 },
    { autoAlpha: 1, duration: span * 0.06 },
    start + span * 0.5,
  );
  tl.to(cursor, { x: 0, y: 0, duration: span * 0.2 }, start + span * 0.58);
  tl.fromTo(
    q('[data-motion="code-preview"]'),
    { autoAlpha: 0, y: 18 },
    { autoAlpha: 1, y: 0, duration: span * 0.1 },
    start + span * 0.66,
  );
  tl.fromTo(
    q('[data-motion="code-preview-el"]'),
    { autoAlpha: 0, y: 8 },
    { autoAlpha: 1, y: 0, duration: span * 0.08, stagger: span * 0.04 },
    start + span * 0.76,
  );
}

// The editor has folded into a context card. Fill the hold with a short
// exchange: sources, a prompt, three hypotheses — two set aside, one kept — and
// a generated artefact the cursor arrives at for review.
function animateAI(
  root: HTMLElement,
  tl: gsap.core.Timeline,
  start: number,
  end: number,
) {
  const q = gsap.utils.selector(root);
  const span = end - start;
  tl.fromTo(
    q('[data-motion="ai-context"]'),
    { autoAlpha: 0, x: -10 },
    { autoAlpha: 1, x: 0, duration: span * 0.09, stagger: span * 0.02 },
    start + span * 0.05,
  );
  tl.fromTo(
    q('[data-motion="ai-prompt"]'),
    { autoAlpha: 0, y: 10 },
    { autoAlpha: 1, y: 0, duration: span * 0.08 },
    start + span * 0.18,
  );
  tl.fromTo(
    q('[data-motion="ai-reply"]'),
    { autoAlpha: 0, y: 10 },
    { autoAlpha: 1, y: 0, duration: span * 0.08 },
    start + span * 0.3,
  );
  tl.fromTo(
    q('[data-motion="ai-option"]'),
    { autoAlpha: 0, x: -8 },
    { autoAlpha: 1, x: 0, duration: span * 0.07, stagger: span * 0.03 },
    start + span * 0.38,
  );
  // Two hypotheses are set aside; the kept one stays lit.
  tl.to(
    q('[data-motion="ai-option"]:not([data-chosen])'),
    { autoAlpha: 0.4, duration: span * 0.08 },
    start + span * 0.56,
  );
  tl.fromTo(
    q(".ai-option[data-chosen]"),
    { "--ai-pick": "0" },
    { "--ai-pick": "1", duration: span * 0.1 },
    start + span * 0.56,
  );
  tl.fromTo(
    q('[data-motion="ai-artifact"]'),
    { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: span * 0.1 },
    start + span * 0.64,
  );
  tl.fromTo(
    q('[data-motion="ai-artifact-el"]'),
    { autoAlpha: 0, y: 8 },
    { autoAlpha: 1, y: 0, duration: span * 0.07, stagger: span * 0.035 },
    start + span * 0.74,
  );
  const cursor = q('[data-motion="ai-cursor"]');
  tl.fromTo(
    cursor,
    { autoAlpha: 0, x: 40, y: 30 },
    { autoAlpha: 1, duration: span * 0.06 },
    start + span * 0.72,
  );
  tl.to(cursor, { x: 0, y: 0, duration: span * 0.2 }, start + span * 0.8);
}

// Almost-empty stage: the three statements arrive in turn, then the CTA.
function animateManifesto(
  root: HTMLElement,
  tl: gsap.core.Timeline,
  start: number,
  end: number,
) {
  const q = gsap.utils.selector(root);
  const span = end - start;
  tl.fromTo(
    q('[data-motion="manifesto-line"]'),
    { autoAlpha: 0, y: 26 },
    { autoAlpha: 1, y: 0, duration: span * 0.16, stagger: span * 0.22 },
    start + span * 0.06,
  );
  tl.fromTo(
    q('[data-scene-panel="manifesto"] .text-link'),
    { autoAlpha: 0, y: 12 },
    { autoAlpha: 1, y: 0, duration: span * 0.12 },
    start + span * 0.82,
  );
}

// The closing split-flap: one panel turns through the seven roles (each a
// scroll stop with a hinge fold), then "I AM A" becomes "I AM", the panel
// reads the name, and the logo, line and CTAs settle. Fully reversible — every
// word is its own layer, none of it depends on swapping text mid-scrub.
// The closing split-flap. A single progress proxy drives a pure render of the
// per-character plates (see split-flap.ts) — no autonomous tweens, so stopping
// mid-flip leaves the plates at that exact angle and scrolling back replays it
// in reverse. The logo/tag stay through both 8A2 and 8B2; only the body and
// CTAs are revealed at the end, as ordinary timeline tweens.
function animateIdentity(
  root: HTMLElement,
  tl: gsap.core.Timeline,
  start: number,
  end: number,
) {
  const q = gsap.utils.selector(root);
  const span = end - start;
  const flapSpan = span * 0.74;

  const rowEl = root.querySelector<HTMLElement>("[data-flap-row]");
  const headA = root.querySelector<HTMLElement>('[data-motion="identity-head-a"]');
  const headB = root.querySelector<HTMLElement>('[data-motion="identity-head-b"]');
  const rolesList = root.querySelector<HTMLElement>('[data-motion="identity-roles"]');
  const liveEl = rowEl?.querySelector<HTMLElement>("[data-flap-live]") ?? null;

  if (rowEl) {
    const plates = [...rowEl.querySelectorAll<HTMLElement>("[data-flap]")];
    // Each message is [row1, row2], every string `cols` chars — a fixed 12 × 2
    // grid, so the plate size never changes.
    const lines: string[][] = JSON.parse(rowEl.dataset.flapLines || "[]");
    const cols = Number(rowEl.dataset.flapCols) || 12;
    const slots = cols * 2;
    const prefixOpen = rowEl.dataset.flapPrefixOpen || "";
    const prefixClose = rowEl.dataset.flapPrefixClose || "";
    const M = lines.length;
    const roleItems = rolesList
      ? [...rolesList.querySelectorAll<HTMLElement>("li")]
      : [];

    // Reading holds dominate; each change is a quick left-to-right wave. A wider
    // hold gives every role its own readable "station".
    const HOLD = 1.9;
    const CHANGE = 0.45;
    // A list item slides in a little way into its role's hold, not with the flip.
    const REVEAL_OFFSET = 0.22;
    const unit = M * HOLD + (M - 1) * CHANGE;

    type Phase = { kind: "hold" | "change"; msg: number; a: number; b: number };
    const phases: Phase[] = [];
    let acc = 0;
    for (let m = 0; m < M; m += 1) {
      phases.push({ kind: "hold", msg: m, a: acc / unit, b: (acc + HOLD) / unit });
      acc += HOLD;
      if (m < M - 1) {
        phases.push({ kind: "change", msg: m, a: acc / unit, b: (acc + CHANGE) / unit });
        acc += CHANGE;
      }
    }
    const lastChange = phases.find((p) => p.kind === "change" && p.msg === M - 2)!;

    const glyphAt = (msg: number, slot: number) => {
      const row = slot < cols ? 0 : 1;
      return lines[msg]?.[row]?.[slot % cols] ?? " ";
    };
    const setGlyph = (plate: HTMLElement, sel: string, ch: string) => {
      const el = plate.querySelector(sel);
      if (!el) return;
      const g = ch === " " ? "" : ch;
      if (el.textContent !== g) el.textContent = g;
    };
    const messageLabel = (msg: number) =>
      `${(lines[msg][0] + " " + lines[msg][1]).replace(/\s+/g, " ").trim()}`;

    let lastLive = "";
    const renderRow = (raw: number) => {
      const t = raw <= 0 ? 0 : raw >= 1 ? 1 : raw;
      const phase = phases.find((p) => t <= p.b) ?? phases[phases.length - 1];

      // "I AM A" → "I AM" cross-fades over the final change. The sequence list
      // stays put — it's the running record of the roles and holds to the end.
      let toClose = 0;
      if (t >= lastChange.b) toClose = 1;
      else if (t > lastChange.a)
        toClose = (t - lastChange.a) / (lastChange.b - lastChange.a);
      if (headA) headA.style.opacity = String(1 - toClose);
      if (headB) headB.style.opacity = String(toClose);

      // Progressive sequence list: item i is in once we've settled into hold(i).
      let reached = -1;
      for (const p of phases) {
        if (p.kind !== "hold") continue;
        if (t >= p.a + (p.b - p.a) * REVEAL_OFFSET) reached = p.msg;
      }
      roleItems.forEach((li, i) => li.classList.toggle("is-in", i <= reached));

      if (phase.kind === "hold" && liveEl) {
        const label =
          phase.msg === M - 1
            ? `${prefixClose} ${messageLabel(M - 1)}`
            : `${prefixOpen} ${messageLabel(phase.msg)}`;
        if (label !== lastLive) {
          liveEl.textContent = label;
          lastLive = label;
        }
      }

      const nextMsg = phase.kind === "change" ? phase.msg + 1 : phase.msg;
      const tp =
        phase.kind === "change" ? (t - phase.a) / (phase.b - phase.a) : 0;

      for (let c = 0; c < slots; c += 1) {
        const plate = plates[c];
        const st = splitFlapStateAt(
          glyphAt(phase.msg, c),
          glyphAt(nextMsg, c),
          tp,
          c,
          slots,
        );
        const frac = st.angle / 180;
        setGlyph(plate, "[data-flap-top]", st.next);
        setGlyph(plate, "[data-flap-bottom]", frac < 0.5 ? st.current : st.next);
        setGlyph(plate, "[data-flap-upper]", st.current);
        setGlyph(plate, "[data-flap-lower]", st.next);
        const s = plate.style;
        s.setProperty("--flap-upper-rot", `${-Math.min(st.angle, 90)}deg`);
        s.setProperty("--flap-lower-rot", `${180 - Math.max(st.angle, 90)}deg`);
        s.setProperty(
          "--flap-upper-op",
          st.angle < 85 ? "1" : st.angle > 95 ? "0" : String((95 - st.angle) / 10),
        );
        s.setProperty(
          "--flap-lower-op",
          st.angle > 95 ? "1" : st.angle < 85 ? "0" : String((st.angle - 85) / 10),
        );
        s.setProperty("--flap-shade", st.shadow.toFixed(3));
      }
    };

    renderRow(0);
    const proxy = { p: 0 };
    tl.to(
      proxy,
      { p: 1, duration: flapSpan, ease: "none", onUpdate: () => renderRow(proxy.p) },
      start,
    );
  }

  // The logo and tag are part of both 8A2 and 8B2, so they arrive with the
  // panel's own fade (enter()) — no separate reveal. Only the body and CTAs
  // (8B2 only) come in after the flap settles.
  const reveal = start + flapSpan + span * 0.04;
  tl.fromTo(
    q('[data-motion="identity-text"]'),
    { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: span * 0.12 },
    reveal,
  );
  tl.fromTo(
    q('[data-motion="identity-ctas"]'),
    { autoAlpha: 0, y: 14 },
    { autoAlpha: 1, y: 0, duration: span * 0.14 },
    reveal + span * 0.08,
  );
}

async function initialize(root: HTMLElement, restore?: Snapshot) {
  const signal = new AbortController();
  let context: gsap.Context | undefined;
  let trigger: ScrollTrigger | undefined;
  let intro: gsap.core.Tween | undefined;
  let bounds: Bounds = desktopBounds;
  let cancelled = false;
  let resizeTimer = 0;
  let hintTimer = 0;
  // The idle nudge is the one autonomous timer allowed: if the greeting settles
  // and the user does not scroll, the cursor bubble swaps to the idle question
  // and then the scroll invite. Cleared on the next scroll and on dispose.
  let idleA = 0;
  let idleB = 0;
  let finishIntro = () => {};
  let refreshHint = () => {};
  let refreshIdle = () => {};
  const save = () => {
    if (trigger)
      write(SAVED, JSON.stringify(snapshotAt(trigger.progress, bounds)));
  };
  dispose = () => {
    cancelled = true;
    signal.abort();
    clearTimeout(resizeTimer);
    clearTimeout(hintTimer);
    clearTimeout(idleA);
    clearTimeout(idleB);
    intro?.kill();
    context?.revert();
    root
      .querySelector<HTMLElement>(".scroll-indicator")
      ?.removeAttribute("data-hint");
    document.documentElement.classList.remove("home-boot");
    root.querySelectorAll<HTMLElement>("[data-scene-panel]").forEach((n) => {
      n.inert = false;
      n.removeAttribute("aria-hidden");
    });
    root.removeAttribute("data-ready");
    root.removeAttribute("data-mode");
  };
  // Fonts are local assets. A timeout also supports offline fallback fonts.
  await Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, 1800)),
  ]);
  if (cancelled || !root.isConnected) return;
  // Narrative copy for the JS-driven bits (idle cursor bubble). Text still lives
  // in the copy contract, keyed by the locale the component rendered with.
  const copy: HomeCopy = homeCopy[(root.dataset.locale as Locale) in homeCopy
    ? (root.dataset.locale as Locale)
    : "es"];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  // The pinned/scrubbed journey runs at every size that isn't asking for
  // reduced motion; phones get the same chapters and beats, only tighter
  // compositions (see `compact`). The stacked static layout is the fallback
  // for reduced motion, no JS, or a failed init.
  const cinematic = !reduce.matches;
  // Below this the chapters stack copy over visual and travel distances shrink.
  const compact = innerWidth < 768;
  const M = compact ? 0.6 : 1;
  root.dataset.mode = reduce.matches ? "static" : "cinematic";
  root.dataset.intro = "done";
  const footer = document.querySelector<HTMLElement>(".home-footer");
  root
    .closest<HTMLElement>(".home-page")
    ?.style.setProperty(
      "--home-footer-height",
      `${footer?.offsetHeight ?? 49}px`,
    );
  root.style.setProperty(
    "--home-track-height",
    `${innerHeight * SCREENS}px`,
  );
  measureConnections(root);
  const panels = [...root.querySelectorAll<HTMLElement>("[data-scene-panel]")];
  const q = gsap.utils.selector(root);
  const saved = restore ?? parseSnapshot(read(SAVED));
  const needsIntro = !reduce.matches && !read(SEEN) && !saved && scrollY < 5;

  try {
    context = gsap.context(() => {
      if (reduce.matches) return;
      const main = gsap.timeline({ defaults: { ease: "none" } });
      main.to({}, { duration: 1 });
      const greeting = q('[data-scene-panel="greeting"]');
      const purpose = q('[data-scene-panel="purpose"]');
      const premise = q('[data-scene-panel="premise"]');
      const board = q('[data-scene-panel="board"]');
      const figma = q('[data-scene-panel="figma"]');
      const code = q('[data-scene-panel="code"]');
      const ai = q('[data-scene-panel="ai"]');
      const manifesto = q('[data-scene-panel="manifesto"]');
      const identity = q('[data-scene-panel="identity"]');
      if (cinematic) {
        // Each chapter after the greeting: fade/slide in over ENTER, sit still
        // for `hold` (its own choreography fills that), then the caller slides
        // it out and advances the cursor. One running position drives them all,
        // so adding a chapter is appending a call — no scattered magic numbers.
        const ENTER = 0.09;
        // `at` is the running insert position; the intro narrative below sets it
        // explicitly before the first enter().
        let at = 0;
        const enter = (
          panel: gsap.TweenTarget,
          hold: number,
          from: gsap.TweenVars,
        ) => {
          const inAt = at;
          // Compact viewports travel shorter and squeeze less.
          const soft: gsap.TweenVars = { ...from };
          if (typeof soft.y === "number") soft.y *= M;
          if (typeof soft.x === "number") soft.x *= M;
          if (typeof soft.scale === "number")
            soft.scale = 1 - (1 - soft.scale) * M;
          main.fromTo(
            panel,
            { autoAlpha: 0, x: 0, y: 0, scale: 1, ...soft },
            { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: ENTER },
            inAt,
          );
          const restAt = inAt + ENTER;
          at = restAt + hold;
          return { inAt, restAt, outAt: at };
        };
        // Scene exits use the same compact scaling.
        const leave = (panel: gsap.TweenTarget, vars: gsap.TweenVars, pos: number) => {
          const v = { ...vars };
          if (typeof v.y === "number") v.y *= M;
          if (typeof v.x === "number") v.x *= M;
          main.to(panel, v, pos);
        };

        // 0 · Intro narrative. Three Figma text boxes are typed and grouped
        // (animateGreeting), a celeste→rosa ribbon carries the composition off
        // and delivers the purpose phrase (animateTransition), which is typed
        // and clicked on its emphasis word (animatePurpose). All scrubbed here.
        const GREET = 1.3;
        const TRANS = 0.42;
        const PURPOSE_HOLD = 0.66;
        const gStart = 0.03;
        const gEnd = gStart + GREET;
        const puStart = gEnd + TRANS;

        animateGreeting(root, main, gStart, GREET, copy);
        leave(greeting, { autoAlpha: 0, y: -72, duration: TRANS * 0.72 }, gEnd);
        animateTransition(root, main, gEnd, gEnd + TRANS);

        main.fromTo(
          purpose,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.06 },
          gEnd + TRANS * 0.55,
        );
        animatePurpose(root, main, puStart, puStart + PURPOSE_HOLD);
        leave(purpose, { autoAlpha: 0, y: -34, duration: 0.08 }, puStart + PURPOSE_HOLD);
        main.to(
          root.querySelector("[data-ribbon-path]"),
          { "--ribbon-op": 0, duration: 0.1 },
          puStart + PURPOSE_HOLD,
        );
        at = puStart + PURPOSE_HOLD + 0.05;

        // 1 → 2 · purpose to premise.
        const PR = enter(premise, 0.15, { y: 40 });
        leave(premise, { autoAlpha: 0, x: -60, duration: 0.09 }, PR.outAt);
        at = PR.outAt + 0.05;

        // 2 → 3 · premise to board; the board runs its cursor choreography
        // through its hold, then the panel recedes as if zoomed past.
        const BD = enter(board, 0.32, { y: 30 });
        animateBoard(root, main, BD.restAt, BD.outAt);
        leave(
          board,
          { autoAlpha: 0, y: -24, scale: 0.96, duration: 0.09 },
          BD.outAt,
        );
        at = BD.outAt + 0.05;

        // 3 → 4 · board to figma. The design-tool window rises where the board
        // receded and assembles: layers, wireframe blocks, properties, then the
        // cursor lands on an element and a feedback pill confirms the test.
        const FG = enter(figma, 0.26, { y: 36, scale: 0.96 });
        animateFigma(root, main, FG.restAt, FG.outAt);
        leave(
          figma,
          { autoAlpha: 0, y: -24, scale: 0.97, duration: 0.09 },
          FG.outAt,
        );
        at = FG.outAt + 0.05;

        // 4 → 5 · figma to code. The canvas becomes an editor: explorer, then
        // the file revealed in blocks (not keystrokes), then the cursor on a
        // line and a live preview building beneath it.
        const CD = enter(code, 0.28, { y: 36, scale: 0.96 });
        animateCode(root, main, CD.restAt, CD.outAt);
        leave(
          code,
          { autoAlpha: 0, y: -24, scale: 0.97, duration: 0.09 },
          CD.outAt,
        );
        at = CD.outAt + 0.05;

        // 5 → 6 · code to AI. The editor becomes a context card; a prompt opens
        // three hypotheses, two are set aside and one is kept, and a verifiable
        // artefact is generated for Paula to review.
        const AI = enter(ai, 0.3, { y: 36, scale: 0.96 });
        animateAI(root, main, AI.restAt, AI.outAt);
        leave(
          ai,
          { autoAlpha: 0, y: -24, scale: 0.97, duration: 0.09 },
          AI.outAt,
        );
        at = AI.outAt + 0.05;

        // 6 → 7 · AI to manifesto. The interface noise clears to near-empty
        // space and the three statements land in turn; the CTA stays after.
        const MF = enter(manifesto, 0.22, { y: 30 });
        animateManifesto(root, main, MF.restAt, MF.outAt);
        leave(manifesto, { autoAlpha: 0, y: -24, duration: 0.09 }, MF.outAt);
        // Clear the sparse identity scene fully before it renders — the flap row
        // is see-through between plates.
        at = MF.outAt + 0.12;

        // 7 → 8 · manifesto to identity. The split-flap panel turns through the
        // seven roles, then "I AM A" becomes "I AM", the panel reads PAULA
        // RODAS, and the logo, line and CTAs settle in. This is the close.
        // The split-flap needs room for nine readable states; give it the
        // widest hold of the journey.
        const ID = enter(identity, 0.82, { y: 36 });
        animateIdentity(root, main, ID.restAt, ID.outAt);
        at = ID.outAt;

        bounds = [
          0,
          // greeting → purpose hand-off happens mid-ribbon, as the composition
          // leaves and the phrase takes the stage.
          gEnd + TRANS * 0.35,
          PR.inAt,
          BD.inAt,
          FG.inAt,
          CD.inAt,
          AI.inAt,
          MF.inAt,
          ID.inAt,
          at,
        ];
      }
      // The scroll hint is not part of the scrubbed timeline — it has its own
      // scroll-idle lifecycle (see the hint controller after the trigger).

      // Opening slice: the white line is drawn down the viewport centre, then
      // sweeps left. The logo waits with its right edge against the line and is
      // uncovered in its wake — clip inset and line share one ease so they stay
      // glued — before the line clears and the logo glides beside the greeting.
      const logo = root.querySelector<HTMLElement>(
        '[data-motion="hero-logo"]',
      )!;
      const line = root.querySelector<HTMLElement>("[data-intro-line]");
      const ui = [
        ...document.querySelectorAll(
          ".home-page > .header, .home-page > .sidebar, .home-footer",
        ),
      ];
      const logoRect = logo.getBoundingClientRect();
      const spread = logoRect.width;
      const revealOffset = innerWidth / 2 - (logoRect.left + spread);
      const covered = `inset(-20% 0% -20% ${spread}px)`;
      const introTl = gsap.timeline();
      introTl.set(logo, { opacity: 1 }, 0);
      if (line) {
        // 25% taller than the logo, centred on it; it draws from its middle out.
        const logoHeight = logoRect.height || 206;
        const lineHeight = logoHeight * 1.5;
        line.style.height = `${lineHeight}px`;
        line.style.top = `${(logoRect.top || (innerHeight - logoHeight) / 2) + logoHeight / 2}px`;
        line.style.marginTop = `${-lineHeight / 2}px`;
        introTl.fromTo(
          line,
          { scaleY: 0, opacity: 1, x: 0, transformOrigin: "center center" },
          { scaleY: 1, duration: 0.5, ease: "power2.inOut" },
          0.15,
        );
        // One continuous sweep: the line tracks the logo's left edge the whole
        // way — while the logo is uncovered in its wake and glides home — so it
        // never rides on top of the logo. Endpoint matches the logo's final left
        // edge (see the shared ease/window with the logo tween below).
        introTl.to(
          line,
          { x: -(spread + revealOffset), duration: 1, ease: "power3.inOut" },
          0.85,
        );
        // Then it shrinks away in place at the logo's edge.
        introTl.to(
          line,
          { opacity: 0, scaleY: 0, duration: 0.32, ease: "power1.in" },
          1.95,
        );
      }
      introTl.fromTo(
        logo,
        { x: revealOffset, clipPath: covered },
        {
          x: 0,
          clipPath: "inset(-20% 0% -20% 0px)",
          duration: 1,
          ease: "power3.inOut",
        },
        0.85,
      );
      introTl.fromTo(
        ui,
        { opacity: 0 },
        { opacity: 1, duration: 0.55, ease: "power1.out" },
        1.5,
      );
      introTl.duration(INTRO);

      const tl = gsap.timeline({ paused: true });
      tl.add(introTl, 0);
      tl.add(main, INTRO);
      // The main timeline is as long as its beats make it; remap the scene cuts
      // (still in main-time) into the whole intro + main progress space.
      const total = INTRO + main.duration();
      const B = (p: number) => (INTRO + p) / total;
      bounds = bounds.map((value, index) =>
        index === bounds.length - 1 ? 1 : B(value),
      );

      const update = (self: ScrollTrigger) => {
        const state = snapshotAt(self.progress, bounds);
        root.dataset.scene = state.scene;
        root.dataset.sceneProgress = state.progress.toFixed(4);
        root.dataset.progress = self.progress.toFixed(4);
        if (cinematic)
          panels.forEach((panel) => {
            const inactive = panel.dataset.scenePanel !== state.scene;
            if (inactive && panel.contains(document.activeElement))
              root.focus({ preventScroll: true });
            panel.inert = inactive;
            panel.setAttribute("aria-hidden", String(inactive));
          });
      };
      trigger = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: () => `+=${Math.max(1, root.offsetHeight - innerHeight)}`,
        invalidateOnRefresh: true,
        animation: tl,
        scrub: true,
        onUpdate: update,
      });
      ScrollTrigger.refresh();
      update(trigger);
      const introEnd = () =>
        trigger!.start + (INTRO / total) * (trigger!.end - trigger!.start);

      // Scroll hint lifecycle: it sits centred on the page at the very start,
      // ducks out the instant the user scrolls, and 3s after they stop it comes
      // back at its resting spot to say there's still more below. Near the end
      // of the journey it stays away — there's nothing left to nudge toward.
      const hintEl = root.querySelector<HTMLElement>(".scroll-indicator");
      let hintArmed = false;
      let hasScrolled = false;
      const showHint = () => {
        if (!hintEl || !trigger) return;
        if (trigger.progress >= 0.95) {
          hintEl.dataset.hint = "away";
          return;
        }
        const atStart = !hasScrolled && trigger.progress <= bounds[1];
        hintEl.dataset.pos = atStart ? "center" : "bottom";
        hintEl.dataset.hint = "show";
      };
      refreshHint = showHint;

      // Idle nudge: the greeting cursor's bubble carries `cursorShort` normally;
      // if the user stops in the settled greeting it becomes the idle question,
      // then the scroll invite. Wall-clock text swap on an aria-hidden bubble —
      // not part of the scrubbed state — cleared on the next scroll.
      const idleMsgEl = root.querySelector<HTMLElement>(
        ".narrative-cursor--greeting [data-cursor-msg]",
      );
      const clearIdle = () => {
        clearTimeout(idleA);
        clearTimeout(idleB);
        if (idleMsgEl) idleMsgEl.textContent = copy.intro.cursorShort;
      };
      const armIdle = () => {
        clearTimeout(idleA);
        clearTimeout(idleB);
        if (!idleMsgEl || !trigger || root.dataset.intro !== "done") return;
        const st = snapshotAt(trigger.progress, bounds);
        if (st.scene !== "greeting" || st.progress < 0.5) return;
        idleA = window.setTimeout(() => {
          idleMsgEl.textContent = copy.intro.idleQuestion;
          idleB = window.setTimeout(() => {
            idleMsgEl.textContent = copy.intro.scrollInvite;
          }, 2600);
        }, 3800);
      };
      refreshIdle = armIdle;

      const onHintScroll = () => {
        if (!hintArmed || !hintEl || root.dataset.intro !== "done") return;
        hasScrolled = true;
        hintEl.dataset.hint = "away";
        clearIdle();
        clearTimeout(hintTimer);
        hintTimer = window.setTimeout(() => {
          showHint();
          armIdle();
        }, 3000);
      };
      window.addEventListener("scroll", onHintScroll, {
        passive: true,
        signal: signal.signal,
      });
      // Ignore the programmatic scroll this init fires while landing the page.
      window.setTimeout(() => {
        hintArmed = true;
      }, 600);

      if (needsIntro) {
        // First visit: auto-scroll through the intro slice. Any real scroll,
        // touch or key press kills this tween and hands the timeline straight to
        // the user at whatever position they interrupted it — no snap.
        root.dataset.intro = "running";
        const proxy = { y: trigger.start };
        intro = gsap.to(proxy, {
          y: introEnd(),
          duration: 2.4,
          ease: "power1.inOut",
          onUpdate: () => window.scrollTo(0, proxy.y),
          onComplete: () => finishIntro(),
        });
        let finished = false;
        finishIntro = () => {
          if (finished) return;
          finished = true;
          intro?.kill();
          root.dataset.intro = "done";
          write(SEEN, "1");
          showHint();
          armIdle();
        };
      } else if (!saved) {
        // Reloads and revisits open at the greeting with the UI already in.
        const target = introEnd();
        if (scrollY < target - 1) {
          window.scrollTo({ top: target, behavior: "instant" });
          ScrollTrigger.update();
        }
        showHint();
        armIdle();
      }
    }, root);
    document.documentElement.classList.remove("home-boot");
    if (trigger && saved) {
      const progress = progressFor(saved, bounds);
      window.scrollTo({
        top: trigger.start + progress * (trigger.end - trigger.start),
        behavior: "instant",
      });
      ScrollTrigger.update();
      refreshHint();
      refreshIdle();
    }
    root.dataset.ready = "true";
  } catch (error) {
    intro?.kill();
    context?.revert();
    panels.forEach((panel) => {
      panel.inert = false;
      panel.removeAttribute("aria-hidden");
    });
    root.dataset.mode = "static";
    root.dataset.intro = "done";
    root.dataset.ready = "true";
    document.documentElement.classList.remove("home-boot");
    console.error(
      "Home motion could not initialize; showing the static story.",
      error,
    );
  }

  for (const event of ["wheel", "touchstart", "pointerdown"] as const)
    window.addEventListener(event, () => finishIntro(), {
      passive: true,
      signal: signal.signal,
    });
  window.addEventListener(
    "keydown",
    (event) => {
      if (
        [
          "Tab",
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        finishIntro();
    },
    { signal: signal.signal },
  );
  window.addEventListener("pagehide", save, { signal: signal.signal });
  document.addEventListener("astro:before-swap", save, {
    signal: signal.signal,
  });
  root.addEventListener(
    "click",
    (event) => {
      if ((event.target as Element).closest("a[href]")) save();
    },
    { signal: signal.signal },
  );
  const width = innerWidth,
    height = innerHeight;
  const rebuild = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const state = trigger ? snapshotAt(trigger.progress, bounds) : undefined;
      finishIntro();
      dispose?.();
      void initialize(root, state);
    }, 160);
  };
  window.addEventListener(
    "resize",
    () => {
      if (innerWidth !== width || Math.abs(innerHeight - height) > 90)
        rebuild();
    },
    { signal: signal.signal },
  );
  reduce.addEventListener("change", rebuild, { signal: signal.signal });
  window.addEventListener(
    "pageshow",
    (event) => {
      if (event.persisted) ScrollTrigger.refresh();
    },
    { signal: signal.signal },
  );
}

export function mountHomeScroll() {
  if (!installed) {
    installed = true;
    document.addEventListener("astro:page-load", mountHomeScroll);
    document.addEventListener("astro:before-swap", () => {
      dispose?.();
      currentRoot = null;
    });
  }
  const root = document.querySelector<HTMLElement>("[data-home-scroll]");
  if (!root || root === currentRoot) return;
  dispose?.();
  currentRoot = root;
  void initialize(root);
}
