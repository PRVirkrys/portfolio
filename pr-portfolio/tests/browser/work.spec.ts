import { test, expect } from '@playwright/test';

test('Work displays only real case studies and exact complete title hooks', async ({ page }) => {
  await page.goto('/portfolio/work/');
  await expect(page.locator('[data-case-card]')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Base — De una parrilla de productos a una experiencia de marca', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'UOC — De catálogo complejo a experiencia de decisión', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'UOC · Universitat Oberta de Catalunya', exact: true })).toBeVisible();
});

test('combined filters update URL, survive case navigation and browser history', async ({ page }) => {
  await page.goto('/portfolio/work/?company=failfast');
  await page.locator('[data-filter="focus"][data-value="UX Design"]').click();
  await expect(page.locator('[data-case-card]:visible')).toHaveCount(1);
  await expect(page).toHaveURL(/company=failfast&focus=UX\+Design/);
  await page.locator('[data-case-card]:visible a').click();
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs.getByRole('link', { name: 'FailFast', exact: true })).toHaveAttribute('href', '/portfolio/work/?company=failfast');
  await expect(crumbs.getByRole('link', { name: 'Work', exact: true })).toHaveAttribute('href', /focus=UX\+Design/);
  await crumbs.getByRole('link', { name: 'Work', exact: true }).click();
  await expect(page.locator('[data-case-card]:visible')).toHaveCount(1);
  await page.locator('[data-filter="focus"][data-value=""]').click();
  await expect(page.locator('[data-case-card]:visible')).toHaveCount(3);
  await page.goBack();
  await expect(page.locator('[data-case-card]:visible')).toHaveCount(1);
});

test('valid empty selections are explained and can be cleared', async ({ page }) => {
  await page.goto('/portfolio/work/?company=lpa&focus=Research');
  await expect(page.locator('[data-case-card]:visible')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'No hay casos con esta selección' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver todos los casos' }).click();
  await expect(page.locator('[data-case-card]:visible')).toHaveCount(3);
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
