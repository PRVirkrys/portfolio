import { test, expect, type Page } from '@playwright/test';

// Scenes in narrative order — mirrors src/components/home-scroll/home-progress.ts.
const SCENES = ['greeting', 'purpose', 'premise', 'board', 'figma', 'code', 'ai', 'manifesto', 'identity'] as const;
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
  for (let i = 0; i < 14; i += 1) {
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

// The message the split-flap has resolved to: the 12 × 2 plate grid read as
// row 1 then row 2, each trimmed, joined with a space.
async function flapText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const row = document.querySelector('[data-flap-row]');
    if (!row) return '';
    const cols = Number(row.getAttribute('data-flap-cols')) || 12;
    const glyphs = [...row.querySelectorAll<HTMLElement>('[data-flap]')]
      .map(f => f.querySelector('[data-flap-bottom]')?.textContent || ' ');
    const r1 = glyphs.slice(0, cols).join('').trim();
    const r2 = glyphs.slice(cols).join('').trim();
    return [r1, r2].filter(Boolean).join(' ');
  });
}

const FLAP_MESSAGES = [
  'UX DESIGNER', 'UI DESIGNER', 'PRODUCT DESIGNER', 'UX ENGINEER',
  'FULL-STACK DEVELOPER', 'BUILDER', 'BRAND DESIGNER', 'PAULA RODAS DEV DESIGNER',
] as const;

// Scroll through the identity scene until the split-flap has settled on `word`.
// Robust to the scrubbed timeline lagging the scrollbar: it steps toward the
// target message and waits out mid-flip readings (holds are wide).
async function seekFlapWord(page: Page, word: string) {
  const targetIdx = FLAP_MESSAGES.indexOf(word as typeof FLAP_MESSAGES[number]);
  await seekScene(page, 'identity', Math.min(0.12 + targetIdx * 0.09, 0.9));
  const range = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  let pos = await page.evaluate(() => window.scrollY / (document.documentElement.scrollHeight - innerHeight));
  let miss = 0;
  for (let i = 0; i < 26; i += 1) {
    const t = await flapText(page);
    if (t === word) return;
    const idx = FLAP_MESSAGES.indexOf(t as typeof FLAP_MESSAGES[number]);
    let dir: number;
    if (idx === -1) { // mid-flip: let the scrub settle, then nudge back a hair
      if (miss < 2) { miss += 1; await page.waitForTimeout(220); continue; }
      dir = -1;
    } else {
      miss = 0;
      dir = idx < targetIdx ? 1 : -1;
    }
    pos = Math.min(1, Math.max(0, pos + dir * 0.005));
    await page.evaluate(y => window.scrollTo(0, y), pos * range);
    await page.waitForTimeout(170);
  }
  expect(await flapText(page), `split-flap never settled on "${word}"`).toBe(word);
}

test('static home is complete when JavaScript is unavailable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322/');
  await expect(page.getByRole('heading', { name: 'El proceso aún importa.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Investigar, pensar y organizar.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Imaginar, dar forma y probar.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Diseñar también es construir.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ampliar lo posible.' })).toBeVisible();
  await expect(page.getByText('Las personas le damos sentido.')).toBeVisible();
  // Identity close renders assembled: the name in plates + the roles list.
  await expect(page.locator('#identity-title')).toHaveText('I AM PAULA RODAS DEV DESIGNER');
  await expect(page.locator('[data-flap-row] [data-flap]').first()).toBeVisible();
  await expect(page.locator('.identity-roles-list')).toContainText('BUILDER');
  await expect(page.locator('.identity-roles-list')).toContainText('FULL-STACK DEVELOPER');
  await expect(page.getByRole('link', { name: 'Let’s talk' })).toHaveAttribute('href', /\/contacto$/);
  await expect(page.getByRole('link', { name: 'Explorar proyectos relacionados' }).first()).toHaveAttribute('href', /\/work$/);
  await expect(page.getByRole('link', { name: 'Explore my work' }).first()).toHaveAttribute('href', /\/work$/);
  await context.close();
});

test('intro hands over to a reversible journey through every chapter, kept on reload', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const root = page.locator('[data-home-scroll]');
  await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root).toHaveAttribute('data-intro', 'done', { timeout: 8000 });
  // The greeting is now three Figma text-mark boxes (¡Hola! / Yo soy / Paula Rodas).
  const marks = page.locator('[data-greeting-marks] .greeting-mark');
  await expect(marks).toHaveCount(3);
  await expect(marks.nth(1)).toContainText('Yo soy');
  await expect(marks.nth(2)).toContainText('Paula Rodas');
  await expect(marks.nth(2)).toHaveAttribute('data-tone', 'purple');
  const nameType = () => marks.nth(2).evaluate(el => Number(getComputedStyle(el).getPropertyValue('--type')) || 0);
  const nameShown = () => marks.nth(2).evaluate(el => Number(getComputedStyle(el).opacity));
  const groupShown = () => page.locator('[data-greeting-group]').evaluate(el => Number(getComputedStyle(el).opacity));
  const headerOpacity = () => page.locator('.header').first().evaluate(el => Number(getComputedStyle(el).opacity));
  const scrollTo = async (progress: number) => {
    await page.evaluate(p => window.scrollTo(0, p * (document.documentElement.scrollHeight - innerHeight)), progress);
    await page.waitForTimeout(350);
  };

  expect(await nameShown()).toBeLessThan(0.5);
  expect(await headerOpacity()).toBeCloseTo(1, 1);
  await scrollTo(.03);
  await expect(root).toHaveAttribute('data-scene', 'greeting');
  expect(await nameShown()).toBeLessThan(0.5);

  // The name box is typed and the three are then selected as a group.
  await seekScene(page, 'greeting', .78);
  await expect(root).toHaveAttribute('data-scene', 'greeting');
  expect(await nameType()).toBeGreaterThan(0.9);
  expect(await groupShown()).toBeGreaterThan(0.2);

  await scrollTo(0);
  expect(await nameType()).toBeLessThan(0.1); // the typing reverses cleanly
  expect(await headerOpacity()).toBeLessThan(.9);

  // Every chapter is reached, in order, on the way down.
  for (const scene of ['purpose', 'premise', 'board', 'figma', 'code', 'ai', 'manifesto', 'identity'] as const) {
    await seekScene(page, scene);
    await expect(root).toHaveAttribute('data-scene', scene);
    await expect(page.locator(`[data-scene-panel="${scene}"]`)).not.toHaveAttribute('inert', '');
  }
  // The purpose phrase takes the stage after the transition ribbon.
  await seekScene(page, 'purpose', .6);
  await expect(page.locator('#purpose-title')).toBeVisible();
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
  for (const scene of ['identity', 'manifesto', 'ai', 'figma', 'board', 'premise', 'purpose', 'greeting'] as const) {
    await seekScene(page, scene, .4);
    await expect(root).toHaveAttribute('data-scene', scene);
  }

  // The intro narrative resolves: the phrase reads in full and its emphasis
  // word ("forma") has turned from the base white to the semantic purple.
  await seekScene(page, 'purpose', .96);
  await expect(page.locator('#purpose-title')).toContainText('forma');
  const emphColour = await page.locator('#purpose-title [data-emphasis]').evaluate(el => getComputedStyle(el).color);
  const restColour = await page.locator('#purpose-title .text-mark__part:not([data-emphasis])').first().evaluate(el => getComputedStyle(el).color);
  expect(emphColour).not.toBe(restColour);
  await expect(page.locator('[data-ribbon-path]')).toHaveAttribute('d', /.+/);

  await seekScene(page, 'figma', .9);
  await expect(page.locator('.figma-window')).toBeVisible();
  await expect(page.locator('.figma-wire__cta')).toBeVisible();
  await seekScene(page, 'code', .9);
  await expect(page.locator('.code-window')).toBeVisible();
  await expect(page.locator('.code-preview__cta')).toBeVisible();
  await expect(page.locator('.code-line[data-active] code')).toBeVisible();
  await seekScene(page, 'ai', .92);
  await expect(page.locator('.ai-window')).toBeVisible();
  await expect(page.locator('.ai-artifact__heading')).toBeVisible();
  await expect(page.locator('.ai-option[data-chosen]')).toBeVisible();
  await seekScene(page, 'manifesto', .9);
  await expect(page.getByText('Las personas le damos sentido.')).toBeVisible();
  // The close is a per-character split-flap, not a single word panel.
  await expect(page.locator('.flip-panel, .flip-word')).toHaveCount(0);
  await expect(page.locator('[data-flap-row] [data-flap]')).not.toHaveCount(1);
  await seekScene(page, 'identity', .04);
  await expect(page.locator('[data-motion="identity-ctas"]')).toBeHidden();
  await seekFlapWord(page, 'UX DESIGNER');                        // its opening hold
  await seekFlapWord(page, 'FULL-STACK DEVELOPER');               // wraps across the 2 rows
  await seekScene(page, 'identity', .95);
  expect(await flapText(page)).toBe('PAULA RODAS DEV DESIGNER');      // name / role close
  await expect(page.locator('[data-motion="identity-head-b"]')).toBeVisible();
  await expect(page.locator('[data-motion="identity-ctas"] .button')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Let’s talk' })).toHaveAttribute('href', /\/contacto$/);
  await expect(page.locator('.identity-roles-list li.is-in')).toHaveCount(7);
  await seekFlapWord(page, 'BRAND DESIGNER');                     // back up → previous role
  await seekScene(page, 'identity', .95);
  await page.reload();
  await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root).toHaveAttribute('data-intro', 'done');
  await expect(root).toHaveAttribute('data-scene', 'identity');
  await scrollTo(0);
  await expect(root).toHaveAttribute('data-scene', 'greeting');
  await expect(page.locator('[data-scene-panel="greeting"]')).not.toHaveAttribute('inert', '');
  expect(errors).toEqual([]);
});

test('the approved intro is frozen: 3px white line, logo reveal, typed name boxes and the narrative cursor', async ({ page }) => {
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
  const marks = page.locator('[data-greeting-marks] .greeting-mark');
  await expect(marks).toHaveCount(3);
  const typeOf = (i: number) =>
    marks.nth(i).evaluate(el => Number(getComputedStyle(el).getPropertyValue('--type')) || 0);
  // The three boxes are typed in order, not all at once.
  await seekScene(page, 'greeting', .22);
  expect(await typeOf(0)).toBeGreaterThan(0.5);
  expect(await typeOf(2)).toBeLessThan(0.2);
  await seekScene(page, 'greeting', .78);
  expect(await typeOf(2)).toBeGreaterThan(0.9);
  await expect(page.locator('.narrative-cursor--greeting')).toBeAttached();
});

test('phone runs the same pinned journey, its phone indicator, and never scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const root = page.locator('[data-home-scroll]');
  await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root).toHaveAttribute('data-mode', 'cinematic'); // not a stacked fallback
  await expect(root).toHaveAttribute('data-intro', 'done', { timeout: 8000 });
  await expect(page.locator('.scroll-indicator__phone')).toBeVisible();
  await expect(page.locator('.scroll-indicator__mouse')).toBeHidden();

  // The same chapters, in order, driven by scroll.
  for (const scene of ['purpose', 'board', 'figma', 'code', 'ai', 'manifesto', 'identity'] as const) {
    await seekScene(page, scene);
    await expect(root).toHaveAttribute('data-scene', scene);
  }
  // The split-flap turns through the roles and still closes on the name.
  await seekFlapWord(page, 'UX DESIGNER');
  await seekScene(page, 'identity', .95);
  expect(await flapText(page)).toBe('PAULA RODAS DEV DESIGNER');
  await expect(page.locator('[data-motion="identity-ctas"] .button')).toBeVisible();
  // Reverse order on the way back up.
  for (const scene of ['manifesto', 'ai', 'code', 'figma', 'board', 'purpose', 'greeting'] as const) {
    await seekScene(page, scene, .4);
    await expect(root).toHaveAttribute('data-scene', scene);
  }

  const noSideScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  expect(await noSideScroll()).toBe(true);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.waitForTimeout(600); // debounced rebuild at the new size
  await expect(root).toHaveAttribute('data-ready', 'true');
  await seekScene(page, 'figma');
  expect(await noSideScroll()).toBe(true);
  await seekScene(page, 'identity', .97);
  expect(await noSideScroll()).toBe(true);
});

test('reduced motion exposes the full story without an automatic intro or a pinned stage', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('[data-home-scroll]')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('[data-home-scroll]')).toHaveAttribute('data-mode', 'static');
  await expect(page.locator('[data-home-scroll]')).toHaveAttribute('data-intro', 'done');
  // Intro narrative degrades to plain text: the three greeting lines and the
  // purpose phrase with its emphasis word already in purple — no cursor,
  // ribbon or selection chrome.
  const marks = page.locator('[data-greeting-marks] .greeting-mark');
  await expect(marks.nth(0)).toContainText('¡Hola!');
  await expect(marks.nth(2)).toContainText('Paula Rodas');
  await expect(page.locator('#purpose-title')).toContainText('Diseño para darle forma a lo que todavía no está claro.');
  {
    const emph = await page.locator('#purpose-title [data-emphasis]').evaluate(el => getComputedStyle(el).color);
    const rest = await page.locator('#purpose-title .text-mark__part:not([data-emphasis])').first().evaluate(el => getComputedStyle(el).color);
    expect(emph).not.toBe(rest);
  }
  await expect(page.locator('.narrative-cursor')).toBeHidden();
  await expect(page.locator('.home-ribbon')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'El proceso aún importa.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Investigar, pensar y organizar.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Imaginar, dar forma y probar.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Diseñar también es construir.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ampliar lo posible.' })).toBeVisible();
  await expect(page.getByText('Las personas le damos sentido.')).toBeVisible();
  // The split-flap degrades to the name / role close plus a plain roles list.
  expect(await flapText(page)).toBe('PAULA RODAS DEV DESIGNER');
  await expect(page.locator('#identity-title')).toHaveText('I AM PAULA RODAS DEV DESIGNER');
  await expect(page.locator('.identity-roles-list')).toBeVisible();
  await expect(page.locator('.identity-roles-list li')).toHaveText([
    'UX DESIGNER', 'UI DESIGNER', 'PRODUCT DESIGNER', 'UX ENGINEER',
    'FULL-STACK DEVELOPER', 'BUILDER', 'BRAND DESIGNER',
  ]);
  await expect(page.locator('.identity-ctas .button')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Let’s talk' })).toHaveAttribute('href', /\/contacto$/);
  // Decorative tool windows stay out of the accessibility tree.
  for (const w of ['.figma-window', '.code-window', '.ai-window'])
    await expect(page.locator(w)).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.scroll-indicator')).toBeHidden();
});
