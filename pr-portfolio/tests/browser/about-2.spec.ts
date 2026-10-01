import { test, expect } from '@playwright/test';

const about2 = '/portfolio/about-2/';

test('about 2 offers the same evolution as a story or a dated journey', async ({ page }) => {
  await page.goto(about2);

  const switcher = page.getByRole('tablist', { name: 'Forma de recorrer la historia' });
  const storyTab = switcher.getByRole('tab', { name: 'Seguir la historia' });
  const journeyTab = switcher.getByRole('tab', { name: 'Explorar por etapas' });

  await expect(storyTab).toHaveAttribute('aria-selected', 'true');
  await expect(journeyTab).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('[data-story-panel]')).toBeVisible();
  await expect(page.locator('[data-journey-panel]')).toBeHidden();
  await expect(page.locator('[data-story-panel] .about-chapter')).toHaveCount(5);
  await expect(page.locator('[data-story-panel]')).toContainText('2010–2015');

  await journeyTab.click();
  await expect(journeyTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-story-panel]')).toBeHidden();
  await expect(page.locator('[data-journey-panel]')).toBeVisible();
  await expect(page.locator('[data-journey-panel] [data-career-chapter]')).toHaveCount(7);
  await expect(page.locator('[data-journey-panel]')).toContainText('Case studies');
});

test('a story chapter can reveal its matching dated stage', async ({ page }) => {
  await page.goto(about2);
  await page.locator('[data-open-journey="3"]').click();

  await expect(page.getByRole('tab', { name: 'Explorar por etapas' })).toHaveAttribute('aria-selected', 'true');
  const lpa = page.locator('[data-journey-panel] [data-career-chapter]').nth(3);
  await expect(lpa).toHaveClass(/is-open/);
  await expect(lpa).toContainText('El código como herramienta de diseño.');
});

test('about 2 connects the present through full stack and responsible AI', async ({ page }) => {
  await page.goto(about2);

  const present = page.getByRole('region', { name: 'La curiosidad sigue ampliando lo que puedo construir.' });
  await expect(present).toContainText('Comprender cómo se construye');
  await expect(present).toContainText('Crear más rápido sin perder el criterio');
  await expect(present).toContainText('MedusaWatch');
  await expect(present).toContainText('el criterio importa más que nunca');

  await expect(page.getByRole('heading', { name: 'Ideas que necesitan dirección. Equipos preparados para construirlas.' })).toBeVisible();
});

test('the original about page remains unchanged', async ({ page }) => {
  await page.goto('/portfolio/about/');
  await expect(page.getByRole('tablist', { name: 'Forma de recorrer la historia' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Crear es cada vez más rápido. El criterio importa más que nunca.' })).toBeVisible();
});

test('the view selector uses the available width on compact layouts', async ({ page }) => {
  for (const width of [674, 900]) {
    await page.setViewportSize({ width, height: 770 });
    await page.goto(about2);

    const tabs = page.getByRole('tablist', { name: 'Forma de recorrer la historia' });
    const box = await tabs.boundingBox();
    expect(box?.width).toBeGreaterThan(width * 0.7);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
