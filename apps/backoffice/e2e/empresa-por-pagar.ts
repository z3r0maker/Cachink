import { expect, type Page } from '@playwright/test';

import { fechaCorta, fechaLarga } from '../src/server/empresa/fechas';
import { DESPACHO, fila, hoyMx, IMPRENTA } from './empresa-facturas';

/**
 * Owner decision 9 in empresa.spec.ts, as boards CD-06e and CD-06f draw it:
 * the invoice on credit is paid on the day the founder picks, and the other
 * one is cancelled only after its confirmation. The suite's invoices are
 * dated the 1st of this month.
 */
const delMes = () => `${hoyMx().slice(0, 7)}-01`;

export async function pagarConFecha(page: Page): Promise<void> {
  const abrir = page.getByRole('button', { name: `Registrar pago a ${DESPACHO.nombre}` });
  await abrir.click();
  const panel = page.getByRole('form', { name: `Registrar el pago a ${DESPACHO.nombre}` });
  const fecha = panel.getByLabel('Fecha de pago');
  await expect(fecha).toBeFocused();
  await expect(fecha).toHaveValue(hoyMx());
  await expect(fecha).toHaveAttribute('min', delMes());
  await expect(fecha).toHaveAttribute('max', hoyMx());
  await expect(panel).toContainText(`No puede ser antes del ${fechaLarga(delMes())}`);
  await expect(panel).toContainText('Sale del banco');

  // «No, regresar» posts nothing and gives the focus back to the row's button.
  await panel.getByRole('button', { name: 'No, regresar' }).click();
  await expect(panel).toBeHidden();
  await expect(abrir).toBeFocused();
  await expect(fila(page, DESPACHO.nombre)).toContainText('a crédito (PPD)');

  await abrir.click();
  await fecha.fill(delMes());
  await panel.getByRole('button', { name: 'Confirmar pago' }).click();
  await expect(fila(page, DESPACHO.nombre)).toContainText(
    `a crédito, pagada el ${fechaCorta(delMes())}`,
  );
}

export async function cancelarConfirmando(page: Page): Promise<void> {
  await page.getByRole('button', { name: `Cancelar la factura de ${IMPRENTA.nombre}` }).click();
  const panel = page.getByRole('form', {
    name: `Confirmar la cancelación de la factura de ${IMPRENTA.nombre}`,
  });
  await expect(
    panel.getByRole('heading', { name: `¿Cancelar la factura de ${IMPRENTA.nombre}?` }),
  ).toBeVisible();
  await expect(panel).toContainText('Revertimos hoy su gasto de $');
  await expect(panel).toContainText('No se puede deshacer.');
  await expect(panel.getByRole('button', { name: 'No, regresar' })).toBeFocused();
  await expect(fila(page, IMPRENTA.nombre)).toContainText('Por pagar');

  await panel.getByRole('button', { name: 'Sí, cancelar la factura' }).click();
  await expect(
    page.getByText('Factura cancelada. Su gasto quedó revertido en Movimientos.'),
  ).toBeVisible();
  const cancelada = fila(page, IMPRENTA.nombre);
  await expect(cancelada).toContainText(`a crédito · cancelada el ${fechaCorta(hoyMx())}`);
  await expect(cancelada).toContainText('Vigente');
  await expect(cancelada.getByRole('link', { name: 'Revertido' })).toBeVisible();
}
