import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  clamp,
  desktopBounds,
  parseSnapshot,
  progressFor,
  snapshotAt,
  type Bounds,
  type Snapshot,
} from "./home-progress";

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

// The closing split-flap: one panel turns through the seven roles (each a
// scroll stop with a hinge fold), then "I AM A" becomes "I AM", the panel
// reads the name, and the logo, line and CTAs settle. Fully reversible — every
// word is its own layer, none of it depends on swapping text mid-scrub.
function animateIdentity(
  root: HTMLElement,
  tl: gsap.core.Timeline,
  start: number,
  end: number,
) {
  const q = gsap.utils.selector(root);
  const span = end - start;
  const words = q('[data-motion="flip-word"]');
  const hinge = q('[data-motion="flip-hinge"]');
  const turns = words.length - 1; // seven role→role/name folds
  const flipZone = span * 0.62;
  const step = flipZone / turns;
  const fold = step * 0.62;

  tl.set(words[0], { autoAlpha: 1, rotationX: 0 }, start);
  for (let k = 1; k < words.length; k += 1) {
    const at = start + span * 0.03 + (k - 1) * step;
    tl.to(words[k - 1], { autoAlpha: 0, rotationX: -90, duration: fold }, at);
    tl.fromTo(
      words[k],
      { autoAlpha: 0, rotationX: 90 },
      { autoAlpha: 1, rotationX: 0, duration: fold },
      at,
    );
    // Hinge shadow swells at the fold's midpoint, then settles.
    tl.fromTo(
      hinge,
      { scaleX: 0.6, autoAlpha: 0.12 },
      { scaleX: 1, autoAlpha: 0.55, duration: fold * 0.5 },
      at,
    );
    tl.to(
      hinge,
      { scaleX: 0.6, autoAlpha: 0.12, duration: fold * 0.5 },
      at + fold * 0.5,
    );
    // The last fold also swaps the header prefix.
    if (k === turns) {
      tl.to(
        q('[data-motion="identity-head-a"]'),
        { autoAlpha: 0, y: -10, duration: fold },
        at,
      );
      tl.fromTo(
        q('[data-motion="identity-head-b"]'),
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: fold },
        at,
      );
    }
  }

  const reveal = start + span * 0.68;
  tl.to(
    q('[data-motion="identity-tag"]'),
    { autoAlpha: 0, duration: span * 0.06 },
    reveal - span * 0.02,
  );
  tl.fromTo(
    q('[data-motion="identity-logo"]'),
    { autoAlpha: 0, x: -32 },
    { autoAlpha: 1, x: 0, duration: span * 0.12 },
    reveal,
  );
  tl.fromTo(
    q('[data-motion="identity-text"]'),
    { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: span * 0.1 },
    reveal + span * 0.08,
  );
  tl.fromTo(
    q('[data-motion="identity-ctas"]'),
    { autoAlpha: 0, y: 14 },
    { autoAlpha: 1, y: 0, duration: span * 0.12 },
    reveal + span * 0.14,
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
  // Pinned/scrubbed choreography needs enough room for the board scene; below
  // this it falls back to the stacked "flow" layout.
  const cinematic = !reduce.matches && innerWidth >= 920 && innerHeight >= 680;
  root.dataset.mode = reduce.matches
    ? "static"
    : cinematic
      ? "cinematic"
      : "flow";
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
          main.fromTo(
            panel,
            { autoAlpha: 0, x: 0, y: 0, scale: 1, ...from },
            { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: ENTER },
            inAt,
          );
          const restAt = inAt + ENTER;
          at = restAt + hold;
          return { inAt, restAt, outAt: at };
        };

        // 0 → 1 · the name has typed and held; cursor goes and the whole
        // greeting + logo composition lifts away as one, uncovering purpose.
        main.set(typingCursors, { display: "none" }, leaveAt);
        main.to(greeting, { autoAlpha: 0, y: -64, duration: 0.08 }, leaveAt);

        const P = enter(purpose, 0.12, { y: 40 });
        main.to(purpose, { autoAlpha: 0, y: -34, duration: 0.08 }, P.outAt);
        at = P.outAt + 0.05;

        // 1 → 2 · purpose to premise.
        const PR = enter(premise, 0.15, { y: 40 });
        main.to(premise, { autoAlpha: 0, x: -60, duration: 0.09 }, PR.outAt);
        at = PR.outAt + 0.05;

        // 2 → 3 · premise to board; the board runs its cursor choreography
        // through its hold, then the panel recedes as if zoomed past.
        const BD = enter(board, 0.32, { y: 30 });
        animateBoard(root, main, BD.restAt, BD.outAt);
        main.to(
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
        main.to(
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
        main.to(
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
        main.to(
          ai,
          { autoAlpha: 0, y: -24, scale: 0.97, duration: 0.09 },
          AI.outAt,
        );
        at = AI.outAt + 0.05;

        // 6 → 7 · AI to manifesto. The interface noise clears to near-empty
        // space and the three statements land in turn; the CTA stays after.
        const MF = enter(manifesto, 0.22, { y: 30 });
        animateManifesto(root, main, MF.restAt, MF.outAt);
        main.to(
          manifesto,
          { autoAlpha: 0, y: -24, duration: 0.09 },
          MF.outAt,
        );
        at = MF.outAt + 0.05;

        // 7 → 8 · manifesto to identity. The split-flap panel turns through the
        // seven roles, then "I AM A" becomes "I AM", the panel reads PAULA
        // RODAS, and the logo, line and CTAs settle in. This is the close.
        const ID = enter(identity, 0.56, { y: 36 });
        animateIdentity(root, main, ID.restAt, ID.outAt);
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
      } else {
        const distance = Math.max(1, root.offsetHeight - innerHeight);
        const startOf = (n: HTMLElement) =>
          n.getBoundingClientRect().top + scrollY - root.offsetTop;
        const purposeStart = clamp(
          (startOf(panels[1]) - innerHeight * 0.5) / distance,
          0.08,
          0.4,
        );
        const premiseStart = clamp(
          (startOf(panels[2]) - innerHeight * 0.5) / distance,
          purposeStart + 0.08,
          0.6,
        );
        const boardStart = clamp(
          (startOf(panels[3]) - innerHeight * 0.5) / distance,
          premiseStart + 0.08,
          0.75,
        );
        const figmaStart = clamp(
          (startOf(panels[4]) - innerHeight * 0.5) / distance,
          boardStart + 0.07,
          0.85,
        );
        const codeStart = clamp(
          (startOf(panels[5]) - innerHeight * 0.5) / distance,
          figmaStart + 0.06,
          0.9,
        );
        const aiStart = clamp(
          (startOf(panels[6]) - innerHeight * 0.5) / distance,
          codeStart + 0.05,
          0.9,
        );
        const manifestoStart = clamp(
          (startOf(panels[7]) - innerHeight * 0.5) / distance,
          aiStart + 0.04,
          0.92,
        );
        const identityStart = clamp(
          (startOf(panels[8]) - innerHeight * 0.5) / distance,
          manifestoStart + 0.04,
          0.96,
        );
        bounds = [0, purposeStart, premiseStart, boardStart, figmaStart, codeStart, aiStart, manifestoStart, identityStart, 1];
        const map = root.querySelector<HTMLElement>(
          '[data-motion="board-map"]',
        )!;
        const start = clamp(
          (startOf(map) - innerHeight * 0.75) / distance,
          boardStart,
          figmaStart,
        );
        animateBoard(root, main, start, figmaStart);
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
