import { test, expect } from '@playwright/test';

test('static home is complete when JavaScript is unavailable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322/');
  await expect(page.getByRole('heading', { name: 'El proceso aún importa.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pensar y organizar' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explorar proyectos relacionados' }).first()).toHaveAttribute('href', '/work');
  await context.close();
});

test('intro hands over to reversible scroll, preserving the chapter on reload', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const root = page.locator('[data-home-scroll]');
  await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root).toHaveAttribute('data-intro', 'done', { timeout: 8000 });
  await expect(page.locator('[data-motion="greeting-prefix"]')).toHaveText('Yo soy');
  const nameChars = page.locator('[data-motion="greeting-name"] .greeting-char');
  const charWidths = () => nameChars.evaluateAll(chars => chars.map(char => char.getBoundingClientRect().width));
  expect((await charWidths()).every(width => width === 0)).toBe(true);
  const headerOpacity = () => page.locator('.header').first().evaluate(el => Number(getComputedStyle(el).opacity));
  expect(await headerOpacity()).toBeCloseTo(1, 1);
  const scrollTo = async (progress: number) => {
    await page.evaluate(p => window.scrollTo(0, p * (document.documentElement.scrollHeight - innerHeight)), progress);
    await page.waitForTimeout(350);
  };
  await scrollTo(.06);
  await expect(root).toHaveAttribute('data-scene', 'greeting');
  expect((await charWidths()).every(width => width === 0)).toBe(true);
  await scrollTo(.28);
  await expect(root).toHaveAttribute('data-scene', 'greeting');
  expect((await charWidths()).every(width => width > 0)).toBe(true);
  await expect(page.locator('[data-motion="greeting-name"] [data-typing-cursor]')).toHaveCSS('display', 'inline-block');
  await scrollTo(0);
  expect((await charWidths()).every(width => width === 0)).toBe(true);
  expect(await headerOpacity()).toBeLessThan(.9);
  await scrollTo(.44);
  await expect(root).toHaveAttribute('data-scene', 'purpose');
  expect((await charWidths()).every(width => width > 0)).toBe(true);
  await expect(page.locator('[data-scene-panel="board"]')).toHaveAttribute('inert', '');
  await scrollTo(.82);
  await expect(root).toHaveAttribute('data-scene', 'board');
  const first = await page.locator('[data-node="research"]').boundingBox();
  await scrollTo(.64);
  await expect(root).toHaveAttribute('data-scene', 'premise');
  await expect(page.locator('[data-scene-panel="board"]')).toHaveAttribute('inert', '');
  await scrollTo(.82);
  const second = await page.locator('[data-node="research"]').boundingBox();
  expect(Math.abs(first!.x - second!.x)).toBeLessThan(1);
  expect(Math.abs(first!.y - second!.y)).toBeLessThan(1);
  await page.reload();
  await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root).toHaveAttribute('data-intro', 'done');
  await expect(root).toHaveAttribute('data-scene', 'board');
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
  await page.evaluate(() => window.scrollTo(0, .28 * (document.documentElement.scrollHeight - innerHeight)));
  await page.waitForTimeout(350);
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
  await page.getByRole('heading', { name: 'Pensar y organizar' }).scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene-panel="board"]')).not.toHaveAttribute('inert', '');
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
  await expect(page.getByRole('heading', { name: 'Pensar y organizar' })).toBeVisible();
  await expect(page.locator('.scroll-indicator')).toBeHidden();
});
