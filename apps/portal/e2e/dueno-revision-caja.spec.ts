import { expect, test } from '@playwright/test';

/**
 * O-30 (Track O, fase 13): Dueño · Revisión de caja. Approving needs cost,
 * category and stock (product) or limit and term (client); merge and reject
 * resolve the record.
 */
test('the inbox: six records, two with a likely duplicate', async ({ page }) => {
  await page.goto('/revision-caja');
  await expect(page.getByRole('heading', { name: 'Revisión de caja' })).toBeVisible();
  await expect(page.getByText('Se parece a Taco de tripa')).toBeVisible();
  await expect(page.getByText('$420.00')).toBeVisible();
});

test('approving a product needs cost, category and stock, and shows the margin', async ({
  page,
}) => {
  await page.goto('/revision-caja');
  await page.getByRole('button', { name: 'Revisar' }).nth(1).click();
  const modal = page.getByRole('dialog', { name: 'Revisar Michelada preparada' });
  const aprobar = modal.getByRole('button', { name: 'Aprobar y agregar al catálogo' });
  await modal.getByLabel('Costo').fill('30');
  await expect(modal.getByText('60%')).toBeVisible();
  await expect(aprobar).toBeDisabled();
  await modal.getByRole('button', { name: 'Bebidas' }).click();
  await modal.getByLabel('Existencias').fill('24');
  await aprobar.click();
  await expect(page.getByRole('status')).toContainText(
    'Michelada preparada entra al catálogo con costo $30.00 y margen 60%.',
  );
  await expect(page.getByText('Michelada preparada', { exact: true })).toHaveCount(0);
});

test('a client is approved with a limit and a term', async ({ page }) => {
  await page.goto('/revision-caja');
  await page.getByRole('button', { name: /Clientes fiados/ }).click();
  await page.getByRole('button', { name: 'Revisar' }).first().click();
  const modal = page.getByRole('dialog', { name: 'Revisar cliente Doña Chelo' });
  await modal.getByRole('button', { name: '$1,000.00' }).click();
  await modal.getByRole('button', { name: '15 días' }).click();
  await modal.getByRole('button', { name: 'Aprobar cliente con límite' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Doña Chelo queda con límite $1,000.00 y plazo 15 días.',
  );
});

test('merging and rejecting resolve the record', async ({ page }) => {
  await page.goto('/revision-caja');
  await page.getByRole('button', { name: 'Revisar' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Fusionar' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Orden de tripa se fusionó con Taco de tripa.',
  );
  await page.getByRole('button', { name: 'Entendido' }).click();
  await page.getByTitle('Rechazar').first().click();
  await expect(page.getByRole('status')).toContainText(
    'Michelada preparada ya no se puede vender en caja.',
  );
});
