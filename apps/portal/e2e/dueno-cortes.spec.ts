import { expect, test } from '@playwright/test';

/**
 * O-31 (Track O, fase 13): Dueño · Cortes de turno. The list derives expected
 * cash and counted cash; the panel shows how it was formed and the operator's
 * count; a corte with a difference can be marked as clarified.
 */
test('the month: −$80.00 net and two cortes to clarify', async ({ page }) => {
  await page.goto('/cortes');
  await expect(page.getByRole('heading', { name: 'Cortes de turno' })).toBeVisible();
  await expect(page.getByText('−$80.00')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Operadores', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('the panel explains a shortfall and marks it clarified', async ({ page }) => {
  await page.goto('/cortes');
  await page.getByRole('row', { name: /Luis Ortega.*13 may/ }).click();
  const panel = page.getByRole('dialog', { name: 'Luis Ortega' });
  await expect(panel.getByText('Faltó')).toBeVisible();
  await expect(
    panel.getByText('«Le di cambio de 200 a un cliente que pagó con 100, ya no lo alcancé»'),
  ).toBeVisible();
  await expect(panel.getByText('×2')).toBeVisible();
  await panel.getByRole('button', { name: 'Marcar como aclarado' }).click();
  await expect(page.getByRole('status')).toContainText(
    'El corte de Luis Ortega del 13 may queda cerrado.',
  );
});

test('filters narrow the list', async ({ page }) => {
  await page.goto('/cortes');
  await page.getByRole('button', { name: 'Por aclarar', exact: true }).click();
  await expect(page.getByRole('row', { name: /Luis Ortega/ })).toHaveCount(2);
  await expect(page.getByRole('row', { name: /Ana Robledo/ })).toHaveCount(0);
});
