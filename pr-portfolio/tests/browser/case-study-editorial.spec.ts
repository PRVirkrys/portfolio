import { test, expect } from '@playwright/test';

const medusaWatch = '/portfolio/work/medusawatch-caso-estudio/';
const problemSummary = 'La investigación apoyó de forma preliminar la hipótesis e hizo visible una tensión relevante: las soluciones basadas en avistamientos son reactivas y dependen de que alguien reporte primero; la oportunidad de MedusaWatch estaba en ayudar a decidir con antelación.';
const sectionHeadings = [
  'Overview',
  'Origen de la idea: convertir conocimiento local en una hipótesis de producto',
  'El reto — comprobar hasta dónde podía acelerar la IA la construcción de un prototipo',
  'Construir con IA sin delegar la dirección',
  '1. Traducir el viento en una decisión por playa',
  '2. Diseñar para la incertidumbre, no ocultarla',
  '3. Elegir una arquitectura proporcional al experimento',
  '4. Adaptar la experiencia a escritorio y móvil',
  'Del prototipo rápido a un producto publicable',
  'Resultado',
  'Lo que todavía falta validar',
  'Aprendizajes',
];

test('MedusaWatch presents the existing story in the editorial case-study layout', async ({ page }) => {
  await page.goto(medusaWatch);

  const summary = page.getByRole('region', { name: 'Resumen ejecutivo' });
  await expect(summary).toBeVisible();
  await expect(summary.getByRole('heading', { name: 'Resumen ejecutivo' })).toBeVisible();
  await expect(summary.getByText('Problema', { exact: true })).toBeVisible();
  await expect(summary.getByText('Enfoque', { exact: true })).toBeVisible();
  await expect(summary.getByText('Resultado', { exact: true })).toBeVisible();
  await expect(summary.getByText(problemSummary, { exact: true })).toBeVisible();
  await expect(summary).toContainText('El PRD reducía la ambigüedad antes de producir código.');
  await expect(summary).toContainText('227 playas de Mallorca con una estimación específica basada en el viento.');
  await expect(page.locator('.cs-article')).toContainText(problemSummary);
});

test('the editorial layout keeps the original narrative and fits desktop and mobile', async ({ page }) => {
  for (const width of [390, 839, 840, 1100, 1101, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(medusaWatch);

    expect(await page.locator('.cs-article h2').allTextContents()).toEqual(sectionHeadings);
    for (const dark of [true, false]) {
      await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});

test('every case study uses sticky section headers; the summary only renders when provided', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/portfolio/work/base-caso-estudio/');
  await expect(page.locator('.cs-section__header').first()).toHaveCSS('position', 'sticky');
  await expect(page.getByRole('region', { name: 'Resumen ejecutivo' })).toHaveCount(0);
});
