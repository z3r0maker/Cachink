import { expect, type Page } from '@playwright/test';

import { adjuntar, hoyMx } from './empresa-facturas';
import { mesesDePrueba } from './empresa-movimientos';
import { abrirEntrada } from './empresa-nav';

/**
 * E-11's «Hacer recurrente cada mes» with an XML (boards CD-06h and CD-01f)
 * for empresa.spec.ts. The supplier's invoice is dated the 1st of last month
 * and paid today: last month is registered by it, this month waits for the
 * next one.
 */
export const MENSUAL = { rfc: 'MME010101AB1', nombre: 'Mensajería mensual E2E, S.A. de C.V.' };

export const recurrente = (page: Page, nombre: string) =>
  page.getByTestId('recurrente').filter({ hasText: nombre });

/** Registers last month's invoice with «Hacer recurrente cada mes» ticked; returns both months. */
export async function registrarMensual(page: Page) {
  const meses = mesesDePrueba();
  await abrirEntrada(page, 'Dinero');
  await page.getByRole('link', { name: '+ Registrar' }).click();
  await expect(page.getByRole('heading', { name: 'Registrar', level: 1 })).toBeVisible();
  await adjuntar(page, 'mensual.xml', {
    emisor: MENSUAL,
    fecha: `${meses.anterior}-01`,
    isr: '0.00',
    ivaRetenido: '0.00',
  });
  await expect(page.getByText('mensual.xml leído · vigente en el SAT')).toBeVisible();
  await page.getByLabel('Fecha de pago').fill(hoyMx());
  await page.getByText('Administración', { exact: true }).click();
  const casilla = page.getByRole('checkbox', { name: /Hacer recurrente cada mes/ });
  await expect(casilla.locator('xpath=..')).toContainText(
    'Cada mes esperamos la factura de este RFC cerca del 1.',
  );
  await casilla.check();
  await page.getByRole('button', { name: 'Registrar gasto' }).click();
  await expect(page).toHaveURL(/\/empresa\/movimientos\?mes=\d{4}-\d{2}$/);
  return meses;
}
