import { test, expect, type Page } from '@playwright/test';

// Scenes in narrative order — mirrors src/components/home-scroll/home-progress.ts.
const SCENES = ['greeting', 'purpose', 'premise', 'board', 'figma'] as const;
type SceneName = typeof SCENES[number];

// Stable test navigation: binary-search the scroll range for the point where the
// pinned journey is showing `scene` at roughly `local` progress within it. Global
// progress is monotonic in (sceneIndex, sceneProgress), so this converges without
// depending on the total scroll length, which changes as chapters are added.
async function seekScene(page: Page, scene: SceneName, local = 0.5) {
  const target = SCENES.indexOf(scene);
  const range = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const read = () => page.evaluate(() => {
    const r = document.querySelector('[data-home-scroll]') as HTMLElement;
    return { scene: r.dataset.scene ?? '', local: Number(r.dataset.sceneProgress ?? 0) };
  });
  let lo = 0, hi = 1;
  for (let i = 0; i < 18; i += 1) {
    const mid = (lo + hi) / 2;
    await page.evaluate(y => window.scrollTo(0, y), mid * range);
    await page.waitForTimeout(40);
    const state = await read();
    const idx = SCENES.indexOf(state.scene as SceneName);
    if (idx < target || (idx === target && state.local < local)) lo = mid; else hi = mid;
  }
  await page.evaluate(y => window.scrollTo(0, y), ((lo + hi) / 2) * range);
  await page.waitForTimeout(300);
}

test('static home is complete when JavaScript is unavailable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322/');
  await expect(page.getByRole('heading', { name: 'El proceso aún importa.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Investigar, pensar y organizar.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Imaginar, dar forma y probar.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explorar proyectos relacionados' }).first()).toHaveAttribute('href', '/work');
  await expect(page.getByRole('link', { name: 'Explore my work' }).first()).toHaveAttribute('href', '/work');
  await context.close();
});

test('intro hands over to a reversible journey through every chapter, kept on reload', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const root = page.locator('[data-home-scroll]');
  await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root).toHaveAttribute('data-intro', 'done', { timeout: 8000 });
  await expect(page.locator('[data-motion="greeting-prefix"]')).toHaveText('Yo soy');
  const nameChars = page.locator('[data-motion="greeting-name"] .greeting-char');
  const charWidths = () => nameChars.evaluateAll(chars => chars.map(char => char.getBoundingClientRect().width));
  const headerOpacity = () => page.locator('.header').first().evaluate(el => Number(getComputedStyle(el).opacity));
  const scrollTo = async (progress: number) => {
    await page.evaluate(p => window.scrollTo(0, p * (document.documentElement.scrollHeight - innerHeight)), progress);
    await page.waitForTimeout(350);
  };

  expect((await charWidths()).every(width => width === 0)).toBe(true);
  expect(await headerOpacity()).toBeCloseTo(1, 1);
  await scrollTo(.03);
  await expect(root).toHaveAttribute('data-scene', 'greeting');
  expect((await charWidths()).every(width => width === 0)).toBe(true);

  // The name is fully typed and still — nothing scrolls away — before it leaves.
  await seekScene(page, 'greeting', .75);
  await expect(root).toHaveAttribute('data-scene', 'greeting');
  expect((await charWidths()).every(width => width > 0)).toBe(true);
  await expect(page.locator('[data-motion="greeting-name"] [data-typing-cursor]')).toHaveCSS('display', 'inline-block');

  await scrollTo(0);
  expect((await charWidths()).every(width => width === 0)).toBe(true);
  expect(await headerOpacity()).toBeLessThan(.9);

  // Every chapter is reached, in order, on the way down.
  for (const scene of ['purpose', 'premise', 'board', 'figma'] as const) {
    await seekScene(page, scene);
    await expect(root).toHaveAttribute('data-scene', scene);
    await expect(page.locator(`[data-scene-panel="${scene}"]`)).not.toHaveAttribute('inert', '');
  }
  // The name is not torn down or reset once it has left the greeting.
  await seekScene(page, 'purpose');
  expect((await charWidths()).every(width => width > 0)).toBe(true);
  await expect(page.locator('[data-scene-panel="board"]')).toHaveAttribute('inert', '');

  // The board holds its geometry when scrolled away and back.
  await seekScene(page, 'board', .4);
  const first = await page.locator('[data-node="research"]').boundingBox();
  await seekScene(page, 'premise');
  await seekScene(page, 'board', .4);
  const second = await page.locator('[data-node="research"]').boundingBox();
  expect(Math.abs(first!.x - second!.x)).toBeLessThan(1);
  expect(Math.abs(first!.y - second!.y)).toBeLessThan(1);

  // And the same chapters unwind in reverse on the way up.
  for (const scene of ['board', 'premise', 'purpose', 'greeting'] as const) {
    await seekScene(page, scene, .4);
    await expect(root).toHaveAttribute('data-scene', scene);
  }

  await seekScene(page, 'figma', .9);
  await expect(page.locator('.figma-window')).toBeVisible();
  await expect(page.locator('.figma-wire__cta')).toBeVisible();
  await expect(page.locator('.figma-cursor')).toBeVisible();
  await page.reload();
  await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root).toHaveAttribute('data-intro', 'done');
  await expect(root).toHaveAttribute('data-scene', 'figma');
  await scrollTo(0);
  await expect(root).toHaveAttribute('data-scene', 'greeting');
  await expect(page.locator('[data-scene-panel="greeting"]')).not.toHaveAttribute('inert', '');
  expect(errors).toEqual([]);
});

test('the approved intro is frozen: 3px white line, logo reveal, typed name and its cursor', async ({ page }) => {
  await page.goto('/');
  const root = page.locator('[data-home-scroll]');
  await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root).toHaveAttribute('data-mode', 'cinematic');
  const line = page.locator('.home-intro__line');
  await expect(line).toHaveCount(1);
  const lineStyle = await line.evaluate(el => {
    const s = getComputedStyle(el);
    return { width: s.width, height: parseFloat(s.height), bg: s.backgroundColor };
  });
  expect(lineStyle.width).toBe('3px');
  expect(lineStyle.height).toBeGreaterThan(140); // ~1.5x the hero logo height
  expect(lineStyle.bg).toBe('rgb(255, 255, 255)');
  await expect(root).toHaveAttribute('data-intro', 'done', { timeout: 8000 });
  await expect(root).toHaveAttribute('data-scene', 'greeting');
  await expect(page.locator('.hero-logo')).toBeVisible();
  await expect(page.locator('.header').first()).toHaveCSS('opacity', '1');
  const nameChars = page.locator('[data-motion="greeting-name"] .greeting-char');
  const typed = () => nameChars.evaluateAll(cs => cs.every(c => c.getBoundingClientRect().width > 0));
  expect(await typed()).toBe(false);
  await seekScene(page, 'greeting', .75);
  expect(await typed()).toBe(true);
  await expect(page.locator('[data-motion="greeting-name"] [data-typing-cursor]')).toHaveCSS('display', 'inline-block');
});

test('phone layout retains all text, uses its phone indicator and never scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('[data-home-scroll]')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('[data-home-scroll]')).toHaveAttribute('data-intro', 'done', { timeout: 8000 });
  await expect(page.locator('.scroll-indicator__phone')).toBeVisible();
  await expect(page.locator('.scroll-indicator__mouse')).toBeHidden();
  await page.getByRole('heading', { name: 'Investigar, pensar y organizar.' }).scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene-panel="board"]')).not.toHaveAttribute('inert', '');
  await page.getByRole('heading', { name: 'Imaginar, dar forma y probar.' }).scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 320, height: 640 });
  const narrowLayout = await page.evaluate(() => ({
    fits: document.documentElement.scrollWidth <= innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
    outside: [...document.querySelectorAll<HTMLElement>('body *')]
      .filter(node => node.getBoundingClientRect().left < -.5 || node.getBoundingClientRect().right > innerWidth + .5)
      .slice(0, 8)
      .map(node => `${node.tagName}.${node.className}`),
  }));
  expect(narrowLayout).toMatchObject({ fits: true });
});

test('reduced motion exposes the full story without an automatic intro or a pinned stage', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('[data-home-scroll]')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('[data-home-scroll]')).toHaveAttribute('data-mode', 'static');
  await expect(page.locator('[data-home-scroll]')).toHaveAttribute('data-intro', 'done');
  await expect(page.getByRole('heading', { name: 'El proceso aún importa.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Investigar, pensar y organizar.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Imaginar, dar forma y probar.' })).toBeVisible();
  await expect(page.locator('.scroll-indicator')).toBeHidden();
});
