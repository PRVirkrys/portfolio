import { test, expect, type Page } from '@playwright/test';
import { caseStudies } from '../support/case-studies.mjs';

const visibleCards = (page: Page) => page.locator('[data-case-card]:visible');
const cardData = (page: Page) => visibleCards(page).evaluateAll(cards => cards.map(card => ({
  company: (card as HTMLElement).dataset.company,
  focus: JSON.parse((card as HTMLElement).dataset.focus ?? '[]') as string[],
})));
const visibleFocuses = (page: Page) => page.locator('[data-filter="focus"]:not([data-value=""]):visible').evaluateAll(buttons => buttons.map(button => (button as HTMLElement).dataset.value));

test('Work displays every case study with its complete title', async ({ page }) => {
  await page.goto('/portfolio/work/');
  await expect(page.locator('[data-case-card]')).toHaveCount(caseStudies.length);
  for (const { title } of caseStudies) {
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  }
});

test('combined filters update URL, survive case navigation and browser history', async ({ page }) => {
  await page.goto('/portfolio/work/?company=failfast');
  await page.locator('[data-filter="focus"][data-value="UX Design"]').click();
  await expect(page).toHaveURL(/company=failfast&focus=UX\+Design/);
  const filtered = await cardData(page);
  expect(filtered.length).toBeGreaterThan(0);
  for (const card of filtered) {
    expect(card.company).toBe('failfast');
    expect(card.focus).toContain('UX Design');
  }
  await visibleCards(page).first().locator('a').click();
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs.getByRole('link', { name: 'FailFast', exact: true })).toHaveAttribute('href', '/portfolio/work/?company=failfast');
  await expect(crumbs.getByRole('link', { name: 'Work', exact: true })).toHaveAttribute('href', /focus=UX\+Design/);
  await crumbs.getByRole('link', { name: 'Work', exact: true }).click();
  await expect(visibleCards(page)).toHaveCount(filtered.length);
  await page.locator('[data-filter="company"][data-value=""]').click();
  await page.locator('[data-filter="focus"][data-value=""]').click();
  await expect(visibleCards(page)).toHaveCount(caseStudies.length);
  await page.goBack();
  await page.goBack();
  await expect(visibleCards(page)).toHaveCount(filtered.length);
});

test('focus options are scoped to the selected company', async ({ page }) => {
  await page.goto('/portfolio/work/');
  for (const company of ['lpa', 'failfast', 'pelt8', 'pr']) {
    await page.locator(`[data-filter="company"][data-value="${company}"]`).click();
    const expected = [...new Set((await cardData(page)).flatMap(card => card.focus))].sort();
    expect((await visibleFocuses(page)).sort()).toEqual(expected);
  }
});

test('switching company drops a focus that has no cases there', async ({ page }) => {
  await page.goto('/portfolio/work/?company=pelt8&focus=Research');
  await expect(visibleCards(page)).toHaveCount(1);
  await page.locator('[data-filter="company"][data-value="lpa"]').click();
  await expect(page).toHaveURL('/portfolio/work/?company=lpa');
  await expect(page.locator('[data-filter="focus"][data-value=""]')).toHaveAttribute('aria-pressed', 'true');
  expect((await visibleCards(page).count())).toBeGreaterThan(0);
});

test('valid empty selections are explained and can be cleared', async ({ page }) => {
  await page.goto('/portfolio/work/?company=lpa&focus=Research');
  await expect(visibleCards(page)).toHaveCount(0);
  await expect(page.locator('[data-filter="focus"][data-value="Research"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'No hay casos con esta selección' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver todos los casos' }).click();
  await expect(visibleCards(page)).toHaveCount(caseStudies.length);
  await expect(page).toHaveURL('/portfolio/work/');
});

for (const width of [390, 768, 1440]) {
  test(`cards do not clip titles or overflow at ${width}px in either theme`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/portfolio/work/');
    for (const dark of [true, false]) {
      await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const title of await page.locator('[data-case-card] h2').all()) {
        expect(await title.evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
      }
    }
  });
}
