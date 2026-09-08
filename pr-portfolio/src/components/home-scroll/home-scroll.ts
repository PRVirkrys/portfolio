import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { clamp, desktopBounds, parseSnapshot, progressFor, snapshotAt, type Bounds, type Snapshot } from './home-progress';

gsap.registerPlugin(ScrollTrigger);
const SEEN = 'paula-home-intro-v1';
const SAVED = 'paula-home-position-v1';
const read = (key: string) => { try { return sessionStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { sessionStorage.setItem(key, value); } catch { /* Private browsing still gets a usable page. */ } };
let dispose: (() => void) | undefined;
let currentRoot: HTMLElement | null = null;
let installed = false;

function measureConnections(root: HTMLElement) {
  const map = root.querySelector<HTMLElement>('[data-motion="board-map"]')!;
  const cards = Object.fromEntries([...map.querySelectorAll<HTMLElement>('[data-node]')].map(n => [n.dataset.node!, n]));
  const box = (id: string) => { const n = cards[id]; return { x: n.offsetLeft, y: n.offsetTop, w: n.offsetWidth, h: n.offsetHeight }; };
  for (const path of map.querySelectorAll<SVGPathElement>('[data-edge]')) {
    const edge = path.dataset.edge!;
    const [from, to] = edge === 'draft' ? ['needs', 'product'] : edge.split('-');
    const a = box(from), b = box(to);
    const horizontal = Math.abs(a.y - b.y) < 10;
    const sx = horizontal ? a.x + a.w : a.x + a.w / 2;
    const sy = horizontal ? a.y + a.h / 2 : a.y + a.h;
    const ex = horizontal ? b.x : b.x + b.w / 2;
    const ey = horizontal ? b.y + b.h / 2 : b.y;
    const middle = (sy + ey) / 2;
    path.setAttribute('d', horizontal ? `M${sx},${sy} H${ex}` : `M${sx},${sy} V${middle} H${ex} V${ey}`);
  }
}

function animateBoard(root: HTMLElement, tl: gsap.core.Timeline, start: number, end: number) {
  const q = gsap.utils.selector(root);
  const span = end - start;
  const cards = q('[data-node]');
  const small = innerWidth < 840;
  tl.fromTo(cards, { opacity: 0, x: (i: number) => [16, -18, 20, -16, 12][i], y: (i: number) => [20, -18, 15, -10, 12][i] }, { opacity: 1, duration: span * .15, stagger: span * .025 }, start);
  tl.to(cards, { x: 0, y: 0, duration: span * .25, stagger: span * .035 }, start + span * .15);
	const paths = q('[data-edge]:not([data-edge="draft"])') as unknown as SVGPathElement[];
  paths.forEach((path, i) => { const length = path.getTotalLength(); tl.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: span * .14 }, start + span * (.40 + i * .065)); });
  const draft = q('[data-edge="draft"]');
  tl.to(draft, { opacity: .65, duration: span * .08 }, start + span * .45);
  tl.to(draft, { opacity: 0, duration: span * .08 }, start + span * .61);
  tl.fromTo(q('[data-motion="board-selection"]'), { opacity: 0, scale: .97 }, { opacity: 1, scale: 1, duration: span * .16 }, start + span * .82);
  const cursor = q('[data-motion="board-cursor"]');
  tl.fromTo(cursor, { opacity: 0, x: small ? -90 : -230, y: -170 }, { opacity: 1, duration: span * .05 }, start);
  tl.to(cursor, { x: small ? -30 : -100, y: -230, duration: span * .18 }, start + span * .08);
  tl.to(cursor, { x: small ? -110 : -280, y: -80, duration: span * .18 }, start + span * .29);
  tl.to(cursor, { x: small ? -30 : -40, y: -130, duration: span * .17 }, start + span * .5);
  tl.to(cursor, { x: 0, y: 0, duration: span * .22 }, start + span * .73);
}

async function initialize(root: HTMLElement, restore?: Snapshot) {
  const signal = new AbortController();
  let context: gsap.Context | undefined;
  let trigger: ScrollTrigger | undefined;
  let intro: gsap.core.Timeline | undefined;
  let bounds: Bounds = desktopBounds;
  let cancelled = false;
  let resizeTimer = 0;
  let finishIntro = () => {};
  const save = () => {
    if (trigger) write(SAVED, JSON.stringify(snapshotAt(trigger.progress, bounds)));
  };
  dispose = () => {
    cancelled = true; signal.abort(); clearTimeout(resizeTimer); intro?.kill(); context?.revert();
    document.documentElement.classList.remove('home-boot');
    root.querySelectorAll<HTMLElement>('[data-scene-panel]').forEach(n => { n.inert = false; n.removeAttribute('aria-hidden'); });
    root.removeAttribute('data-ready'); root.removeAttribute('data-mode');
  };
  // Fonts are local assets. A timeout also supports offline fallback fonts.
  await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1800))]);
  if (cancelled || !root.isConnected) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const cinematic = !reduce.matches && innerWidth >= 1024 && innerHeight >= 760;
  root.dataset.mode = reduce.matches ? 'static' : cinematic ? 'cinematic' : 'flow';
  root.dataset.intro = 'done';
  const footer = document.querySelector<HTMLElement>('.home-footer');
  root.closest<HTMLElement>('.home-page')?.style.setProperty('--home-footer-height', `${footer?.offsetHeight ?? 49}px`);
  root.style.setProperty('--home-track-height', `${innerHeight * 5.6}px`);
  measureConnections(root);
  const panels = [...root.querySelectorAll<HTMLElement>('[data-scene-panel]')];
  const q = gsap.utils.selector(root);
  const saved = restore ?? parseSnapshot(read(SAVED));
  const needsIntro = !reduce.matches && !read(SEEN) && !saved && scrollY < 5;

  try {
    context = gsap.context(() => {
      if (reduce.matches) return;
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      tl.to({}, { duration: 1 });
      const greeting = q('[data-scene-panel="greeting"]');
      const greetingText = q('.greeting-line');
      const greetingChars = q('.greeting-char') as HTMLElement[];
      const typingCursors = q('[data-typing-cursor]') as HTMLElement[];
      const premise = q('[data-scene-panel="premise"]');
      const board = q('[data-scene-panel="board"]');
      const characterWidths = greetingChars.map(char => char.getBoundingClientRect().width);
      gsap.set(greetingChars, { width: 0, opacity: 0 });
      gsap.set(typingCursors, { display: 'none' });
      gsap.set(typingCursors[0], { display: 'inline-block' });
      tl.to(greetingChars, {
        width: (index: number) => characterWidths[index],
        opacity: 1,
        duration: .001,
        stagger: .0045,
        ease: 'steps(1)',
      }, .015);
      const lineEnds = greetingText.map(line => line.querySelectorAll('.greeting-char').length)
        .reduce<number[]>((ends, length) => [...ends, length + (ends.at(-1) ?? 0)], []);
      lineEnds.slice(0, -1).forEach((end, index) => {
        const at = .015 + end * .0045;
        tl.set(typingCursors[index], { display: 'none' }, at);
        tl.set(typingCursors[index + 1], { display: 'inline-block' }, at);
      });
      if (cinematic) {
        tl.to(greeting, { opacity: 0, duration: .12 }, .14);
        tl.to(q('[data-motion="logo-left"]'), { x: -300, y: -50, duration: .19 }, .14);
        tl.to(q('[data-motion="logo-upper"]'), { x: 80, y: -240, duration: .19 }, .14);
        tl.to(q('[data-motion="logo-lower"]'), { x: 330, y: 230, duration: .19 }, .14);
        tl.fromTo(premise, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .09 }, .20);
        tl.to(premise, { autoAlpha: 0, x: -60, duration: .10 }, .40);
        tl.fromTo(board, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: .09 }, .45);
        animateBoard(root, tl, .52, .93);
      } else {
        const distance = Math.max(1, root.offsetHeight - innerHeight);
        const startOf = (n: HTMLElement) => n.getBoundingClientRect().top + scrollY - root.offsetTop;
        const premiseStart = clamp((startOf(panels[1]) - innerHeight * .5) / distance, .1, .5);
        const boardStart = clamp((startOf(panels[2]) - innerHeight * .5) / distance, premiseStart + .1, .8);
        bounds = [0, premiseStart, boardStart, 1];
        const map = root.querySelector<HTMLElement>('[data-motion="board-map"]')!;
        const start = clamp((startOf(map) - innerHeight * .75) / distance, boardStart, .8);
        animateBoard(root, tl, start, .96);
      }
      tl.to(q('[data-motion="scroll-indicator"]'), { autoAlpha: 0, duration: .04 }, .96);
      const update = (self: ScrollTrigger) => {
        const state = snapshotAt(self.progress, bounds);
        root.dataset.scene = state.scene;
        root.dataset.progress = self.progress.toFixed(4);
        if (cinematic) panels.forEach(panel => {
          const inactive = panel.dataset.scenePanel !== state.scene;
          if (inactive && panel.contains(document.activeElement)) root.focus({ preventScroll: true });
          panel.inert = inactive;
          panel.setAttribute('aria-hidden', String(inactive));
        });
      };
      trigger = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: () => `+=${Math.max(1, root.offsetHeight - innerHeight)}`,
        invalidateOnRefresh: true,
        animation: tl,
        scrub: true,
        onUpdate: update,
      });
      ScrollTrigger.refresh();
      update(trigger);
      if (needsIntro) {
        root.dataset.intro = 'running';
        const logo = root.querySelector<HTMLElement>('[data-motion="hero-logo"]')!;
        const scene = panels[0].getBoundingClientRect();
        const logoRect = logo.getBoundingClientRect();
        const ui = [...document.querySelectorAll('.home-page > .header, .home-page > .sidebar, .home-footer'), ...q('.scroll-indicator')];
        const centerOffset = scene.left + scene.width / 2 - (logoRect.left + logoRect.width / 2);
        trigger.disable(false);
        intro = gsap.timeline({ onComplete: () => finishIntro() });
        intro.fromTo(logo, { opacity: 0, scale: .25, x: centerOffset, filter: 'blur(5px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .85, ease: 'power2.out' }, .35);
        intro.to(logo, { x: 0, duration: .55, ease: 'power2.inOut' }, 1.2);
        intro.fromTo(ui, { opacity: 0 }, { opacity: 1, duration: .6 }, 1.45);
        let finished = false;
        finishIntro = () => {
          if (finished) return; finished = true;
          intro?.progress(1).kill();
          gsap.set(logo, { clearProps: 'transform,opacity,filter' });
          gsap.set(ui, { clearProps: 'opacity' });
          root.dataset.intro = 'done'; write(SEEN, '1');
          trigger?.enable(false, false); ScrollTrigger.update();
        };
      }
    }, root);
    document.documentElement.classList.remove('home-boot');
    if (trigger && saved) {
      const progress = progressFor(saved, bounds);
      window.scrollTo({ top: trigger.start + progress * (trigger.end - trigger.start), behavior: 'instant' });
      ScrollTrigger.update();
    }
    root.dataset.ready = 'true';
  } catch (error) {
    intro?.kill(); context?.revert();
    panels.forEach(panel => { panel.inert = false; panel.removeAttribute('aria-hidden'); });
    root.dataset.mode = 'static'; root.dataset.intro = 'done'; root.dataset.ready = 'true';
    document.documentElement.classList.remove('home-boot');
    console.error('Home motion could not initialize; showing the static story.', error);
  }

  for (const event of ['wheel', 'touchstart', 'pointerdown'] as const) window.addEventListener(event, () => finishIntro(), { passive: true, signal: signal.signal });
  window.addEventListener('keydown', event => { if (['Tab', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) finishIntro(); }, { signal: signal.signal });
  window.addEventListener('pagehide', save, { signal: signal.signal });
  document.addEventListener('astro:before-swap', save, { signal: signal.signal });
  root.addEventListener('click', event => { if ((event.target as Element).closest('a[href]')) save(); }, { signal: signal.signal });
  const width = innerWidth, height = innerHeight;
  const rebuild = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const state = trigger ? snapshotAt(trigger.progress, bounds) : undefined;
      finishIntro(); dispose?.(); void initialize(root, state);
    }, 160);
  };
  window.addEventListener('resize', () => { if (innerWidth !== width || Math.abs(innerHeight - height) > 90) rebuild(); }, { signal: signal.signal });
  reduce.addEventListener('change', rebuild, { signal: signal.signal });
  window.addEventListener('pageshow', event => { if (event.persisted) ScrollTrigger.refresh(); }, { signal: signal.signal });
}

export function mountHomeScroll() {
  if (!installed) {
    installed = true;
    document.addEventListener('astro:page-load', mountHomeScroll);
    document.addEventListener('astro:before-swap', () => { dispose?.(); currentRoot = null; });
  }
  const root = document.querySelector<HTMLElement>('[data-home-scroll]');
  if (!root || root === currentRoot) return;
  dispose?.(); currentRoot = root;
  void initialize(root);
}
