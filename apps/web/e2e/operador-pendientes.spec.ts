import { expect, test } from '@playwright/test';

import { puertaOperador } from './puerta-operador';

/**
 * O-27 (Track O, fase 12): Operador · Registros por enviar. «Reintentar envío»
 * empties the queue, and the shell's pill follows the same state.
 */
test.beforeEach(() => test.setTimeout(120_000));

test('the queue: three records, their sum, and the rule not to lose them', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/pendientes');
  await expect(page.getByText('3 registros en espera')).toBeVisible();
  await expect(
    page.getByText('Suman $283.00 de ventas y un gasto de $620.00.', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText('No cierres la pestaña ni borres los datos del sitio', { exact: false }),
  ).toBeVisible();
});

test('retrying sends everything; the empty queue leads to the close', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/pendientes');
  await page.getByRole('button', { name: 'Reintentar envío' }).click();
  await expect(page.getByText('Enviando 3 registros…')).toBeVisible();
  await expect(page.getByText('Todo enviado').first()).toBeVisible();
  await expect(page.getByText('Nada pendiente')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ir al cierre de turno' })).toHaveAttribute(
    'href',
    '/operador/cierre',
  );
});

test('after sending, the queue stays empty across screens', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/pendientes');
  await page.getByRole('button', { name: 'Reintentar envío' }).click();
  await expect(page.getByText('Nada pendiente')).toBeVisible();
  await page.getByRole('link', { name: 'Volver a la caja' }).click();
  await page.getByTitle('Ver registros pendientes').click();
  await expect(page.getByText('Nada pendiente')).toBeVisible();
});
