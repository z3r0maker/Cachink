import { expect, test } from '@playwright/test';

/**
 * O-14 (Track O, fase 10): Operador · Inicio answers «what do I do now».
 * Happy path on the design fixture; state forcing is development-only, so the
 * four states are swept by the design comparison, not here (ADR-058).
 */
test('Inicio leads with one action and lists what is pending today', async ({ page }) => {
  await page.goto('/operador');

  await expect(page.getByRole('heading', { level: 1, name: 'Buenas tardes, Ana' })).toBeVisible();
  await expect(page.getByText('La caja está lista')).toBeVisible();
  for (const label of ['Ventas de tu turno', 'Cobrado', 'Efectivo esperado', 'Fiado de hoy']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(page.getByText('$2,710.00')).toBeVisible();
  await expect(page.getByText('Una cancelada a las 12:58')).toBeVisible();
  await expect(page.getByText('Registrar el gas de la semana')).toBeVisible();

  await page.getByRole('link', { name: 'Cobrar', exact: true }).click();
  await expect(page).toHaveURL(/\/operador\/caja$/);
});

test('«Hoy no» takes a task off today’s list', async ({ page }) => {
  await page.goto('/operador');
  await expect(page.getByText('Llegó el agua embotellada')).toBeVisible();
  await page.getByTitle('Quitar de la lista de hoy').last().click();
  await expect(page.getByText('Llegó el agua embotellada')).toHaveCount(0);
  await expect(page.getByText('Registrar el gas de la semana')).toBeVisible();
});

test('the owner messages link through to Avisos', async ({ page }) => {
  await page.goto('/operador');
  await page.getByRole('link', { name: 'Ver todos' }).click();
  await expect(page).toHaveURL(/\/operador\/avisos$/);
});
