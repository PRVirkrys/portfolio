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
// GSAP beat positions are proportions of the main timeline, not of this.
const SCREENS = 16;
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

// The closing split-flap — VARIANT: real-time playback instead of scrub.
// A progress proxy drives the same pure per-character render (see split-flap.ts),
// but on its own paused timeline. `update()` plays it while the identity scene is
// on screen and pauses it — frozen at that exact frame — when the viewer scrolls
// away, so it always resumes from where it stopped. The logo/tag arrive with the
// panel's own fade; the body and CTAs tail this same timeline.
function animateIdentity(root: HTMLElement): gsap.core.Timeline | null {
  const q = gsap.utils.selector(root);

  const rowEl = root.querySelector<HTMLElement>("[data-flap-row]");
  const headA = root.querySelector<HTMLElement>('[data-motion="identity-head-a"]');
  const headB = root.querySelector<HTMLElement>('[data-motion="identity-head-b"]');
  const rolesList = root.querySelector<HTMLElement>('[data-motion="identity-roles"]');
  const liveEl = rowEl?.querySelector<HTMLElement>("[data-flap-live]") ?? null;

  const flapTl = gsap.timeline({ paused: true });

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
    // Real time, not scroll: ~SECONDS_PER_UNIT wall-clock seconds per reading
    // unit. Handed back paused; the scene gate in `update()` runs and freezes it.
    const SECONDS_PER_UNIT = 0.7;
    const proxy = { p: 0 };
    flapTl.to(proxy, {
      p: 1,
      duration: unit * SECONDS_PER_UNIT,
      ease: "none",
      onUpdate: () => renderRow(proxy.p),
    });
  }

  // The body copy and CTAs settle in on the same timeline, right after the flap
  // lands its close — so the whole identity close is one self-contained beat.
  flapTl.fromTo(
    q('[data-motion="identity-text"]'),
    { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.5 },
    ">-0.15",
  );
  flapTl.fromTo(
    q('[data-motion="identity-ctas"]'),
    { autoAlpha: 0, y: 14 },
    { autoAlpha: 1, y: 0, duration: 0.6 },
    "<0.12",
  );

  return flapTl;
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
  let finishIntro = () => {};
  let refreshHint = () => {};
  const save = () => {
    if (trigger)
      write(SAVED, JSON.stringify(snapshotAt(trigger.progress, bounds)));
  };
  dispose = () => {
    cancelled = true;
    signal.abort();
    clearTimeout(resizeTimer);
    clearTimeout(hintTimer);
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
      // VARIANT: the identity split-flap is not on this scrubbed timeline; it
      // runs on its own clock, gated by the scene state in `update()`.
      let flapTl: gsap.core.Timeline | null = null;
      const greeting = q('[data-scene-panel="greeting"]');
      const greetingText = q(".greeting-line");
      const greetingChars = q(".greeting-char") as HTMLElement[];
      const typingCursors = q("[data-typing-cursor]") as HTMLElement[];
      const purpose = q('[data-scene-panel="purpose"]');
      const premise = q('[data-scene-panel="premise"]');
      const board = q('[data-scene-panel="board"]');
      const figma = q('[data-scene-panel="figma"]');
      const code = q('[data-scene-panel="code"]');
      const ai = q('[data-scene-panel="ai"]');
      const manifesto = q('[data-scene-panel="manifesto"]');
      const identity = q('[data-scene-panel="identity"]');
      const characterWidths = greetingChars.map(
        (char) => char.getBoundingClientRect().width,
      );
      gsap.set(greetingChars, { width: 0, opacity: 0 });
      gsap.set(typingCursors, { display: "none" });
      // One set of phase marks so the greeting holds — fully visible, static —
      // until the whole name is typed. Nothing scrolls or scatters mid-type.
      const TYPE_AT = 0.025;
      const TYPE_STEP = 0.006;
      const typeEnd =
        TYPE_AT + Math.max(0, greetingChars.length - 1) * TYPE_STEP;
      const leaveAt = typeEnd + 0.06; // fully-typed dwell, then it may leave

      // The typing cursor stays hidden through the intro; it only shows once the
      // logo has finished moving left, i.e. from the start of the main slice.
      main.set(typingCursors[0], { display: "inline-block" }, 0);
      main.to(
        greetingChars,
        {
          width: (index: number) => characterWidths[index],
          opacity: 1,
          duration: 0.001,
          stagger: TYPE_STEP,
          ease: "steps(1)",
        },
        TYPE_AT,
      );
      const lineEnds = greetingText
        .map((line) => line.querySelectorAll(".greeting-char").length)
        .reduce<number[]>(
          (ends, length) => [...ends, length + (ends.at(-1) ?? 0)],
          [],
        );
      lineEnds.slice(0, -1).forEach((end, index) => {
        const at = TYPE_AT + end * TYPE_STEP;
        main.set(typingCursors[index], { display: "none" }, at);
        main.set(typingCursors[index + 1], { display: "inline-block" }, at);
      });
      if (cinematic) {
        // Each chapter after the greeting: fade/slide in over ENTER, sit still
        // for `hold` (its own choreography fills that), then the caller slides
        // it out and advances the cursor. One running position drives them all,
        // so adding a chapter is appending a call — no scattered magic numbers.
        const ENTER = 0.09;
        let at = leaveAt;
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

        // 0 → 1 · the name has typed and held; cursor goes and the whole
        // greeting + logo composition lifts away as one, uncovering purpose.
        main.set(typingCursors, { display: "none" }, leaveAt);
        leave(greeting, { autoAlpha: 0, y: -64, duration: 0.08 }, leaveAt);

        const P = enter(purpose, 0.12, { y: 40 });
        leave(purpose, { autoAlpha: 0, y: -34, duration: 0.08 }, P.outAt);
        at = P.outAt + 0.05;

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
        flapTl = animateIdentity(root);
        at = ID.outAt;

        bounds = [
          0,
          P.inAt + 0.02,
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
        // VARIANT: run the split-flap on real time while its scene is on screen;
        // freeze it in place the instant the viewer leaves, resume on return.
        if (flapTl) {
          const onScreen = state.scene === "identity";
          if (onScreen && flapTl.paused()) flapTl.play();
          else if (!onScreen && !flapTl.paused()) flapTl.pause();
        }
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
      const onHintScroll = () => {
        if (!hintArmed || !hintEl || root.dataset.intro !== "done") return;
        hasScrolled = true;
        hintEl.dataset.hint = "away";
        clearTimeout(hintTimer);
        hintTimer = window.setTimeout(showHint, 3000);
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
        };
      } else if (!saved) {
        // Reloads and revisits open at the greeting with the UI already in.
        const target = introEnd();
        if (scrollY < target - 1) {
          window.scrollTo({ top: target, behavior: "instant" });
          ScrollTrigger.update();
        }
        showHint();
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
