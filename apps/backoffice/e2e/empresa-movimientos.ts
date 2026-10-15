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

export const E2E_RECURRENTE = 'E2E Contador';

/** `YYYY-MM` of today in Mexico City, and of the month before (the console's calendar). */
export function mesesDePrueba(): { readonly actual: string; readonly anterior: string } {
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(
    new Date(),
  );
  const year = Number(hoy.slice(0, 4));
  const month = Number(hoy.slice(5, 7));
  const anterior = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`;
  return { actual: hoy.slice(0, 7), anterior };
}

/** E-02's «Hacer recurrente cada mes»: the contador's fee, charged on the 1st of last month. */
export async function repetirGasto(page: Page, mes: string) {
  await page.goto('/empresa/movimientos/registrar');
  await page.getByRole('textbox', { name: 'Concepto', exact: true }).fill(E2E_RECURRENTE);
  await page.getByLabel('Fecha de pago', { exact: true }).fill(`${mes}-01`);
  await page.getByRole('textbox', { name: 'Monto pagado', exact: true }).fill('3500');
  await page.getByText('Administración', { exact: true }).click();
  await expect(page.getByText('Te recordamos registrarlo cada 1.')).toBeVisible();
  await page.getByRole('checkbox', { name: /Hacer recurrente cada mes/ }).check();
  await page.getByRole('button', { name: 'Registrar gasto' }).click();
  await expect(page).toHaveURL(new RegExp(`/empresa/movimientos\\?mes=${mes}$`));
}

/** This month's suggestion opens Registrar prefilled; registering it leaves the month done. */
export async function registrarLaSugerencia(page: Page, mes: string) {
  await page.goto(`/empresa/movimientos?mes=${mes}`);
  const sugerido = page.getByTestId('movimiento-sugerido').filter({ hasText: E2E_RECURRENTE });
  await expect(sugerido).toContainText('−$3,500.00');
  await expect(sugerido).toContainText('Sugerido');
  await sugerido.getByRole('link', { name: E2E_RECURRENTE }).click();
  await expect(page.getByText(`Registra el cargo de ${E2E_RECURRENTE} de`)).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Monto pagado', exact: true })).toHaveValue(
    '3500.00',
  );
  await page.getByRole('button', { name: 'Registrar gasto' }).click();
  await expect(page).toHaveURL(new RegExp(`/empresa/movimientos\\?mes=${mes}$`));
}
