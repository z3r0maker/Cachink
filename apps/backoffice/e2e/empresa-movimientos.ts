import { expect, type Page } from '@playwright/test';

import { E2E_CONCEPTO } from './founder-fixture';

/** E-02's capture steps for empresa.spec.ts: a USD expense, refused once, then recorded. */
export async function registrarGastoEnDolares(page: Page) {
  await page.getByRole('link', { name: '+ Registrar' }).click();
  await page.getByRole('textbox', { name: 'Concepto', exact: true }).fill(E2E_CONCEPTO);
  await page.getByRole('textbox', { name: 'Proveedor', exact: true }).fill('Vercel Inc.');
  await page.getByText('Dólares (USD)').click();
  await page.getByRole('textbox', { name: 'Monto pagado (USD)', exact: true }).fill('veinte');
  await page.getByRole('textbox', { name: 'Tipo de cambio del día', exact: true }).fill('18.42');
  await page.getByText('Costo del servicio').click();
  await page.getByRole('button', { name: 'Registrar gasto' }).click();
  await expect(page.getByText('Escribe el monto con números, por ejemplo 368.40.')).toBeVisible();
  // The rest of what was typed survives the refusal.
  await expect(page.getByRole('textbox', { name: 'Concepto', exact: true })).toHaveValue(
    E2E_CONCEPTO,
  );

  await page.getByRole('textbox', { name: 'Monto pagado (USD)', exact: true }).fill('20');
  await expect(page.getByText('Equivale a $368.40 MXN.')).toBeVisible();
  await page.getByRole('button', { name: 'Registrar gasto' }).click();
}
