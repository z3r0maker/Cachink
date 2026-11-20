import {
  addOperator,
  mintCodeFor,
  mintTenant,
  resetThrottle,
  walkOperatorDoor,
} from '@xangarro/testing/tenant';
import { hash } from 'bcryptjs';

import { expect, test } from './test';

import { puertaOperador } from './puerta-operador';

/**
 * O-11 (Track O, fase 10): the operator shell. The design's gate for a shell is
 * that navigating between screens keeps the active item and moves nothing.
 */
const DESTINOS = [
  'Cobrar',
  'Mi turno',
  'Ventas',
  'Gastos',
  'Inventario',
  'Fiado y abonos',
  'Inicio',
];

test.beforeEach(() => test.setTimeout(120_000));

test('the operator shell stays put while the active item follows the route', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador');
  const aside = page.locator('aside').filter({ hasText: 'XANGARRO!' });
  const first = await aside.boundingBox();

  for (const label of DESTINOS) {
    await aside.getByRole('link', { name: label, exact: true }).click();
    await expect(aside.getByRole('link', { name: label, exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(await aside.boundingBox()).toEqual(first);
  }
});

test('the header links the sync pill and the bell to their screens', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/turno');
  await page.getByTitle('Ver registros pendientes').click();
  await expect(page).toHaveURL(/\/operador\/pendientes$/);
  await page.goto('/operador/turno');
  await page.getByRole('link', { name: /^Avisos · \d+ sin leer$/ }).click();
  await expect(page).toHaveURL(/\/operador\/avisos$/);
});

test('the sidebar names the operator signed in, their business and their turno, never the design’s', async ({
  page,
}) => {
  // A business of its own, with an operator who is not the fixture's Ana.
  const t = await mintTenant({ label: 'Fonda' });
  await addOperator(t, { nombre: 'Rosa Medina', pinHash: await hash('4826', 10) });
  await resetThrottle();
  const code = await mintCodeFor(t);
  await page.goto('/operador/caja');
  await walkOperatorDoor(page, {
    email: t.email,
    code,
    operador: 'Rosa Medina',
    nip: '4826',
    fondo: '500',
  });

  const aside = page.locator('aside').filter({ hasText: 'XANGARRO!' });
  await expect(aside).toContainText('Rosa Medina');
  await expect(aside).toContainText(t.nombre);
  await expect(aside).toContainText(/Cobrando desde las \d{2}:\d{2}/);
  await expect(aside).not.toContainText('Ana Robledo');
  await expect(aside).not.toContainText('Taquería Don Pedro');
});

test('an unknown operator path is a 404, not an empty screen', async ({ page }) => {
  await puertaOperador(page);
  const response = await page.request.get('/operador/no-existe');
  expect(response.status()).toBe(404);
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('below 760 px the sidebar gives way to a four-tab bar', async ({ page }) => {
    await puertaOperador(page);
    await page.goto('/operador/ventas');
    await expect(page.locator('aside').filter({ hasText: 'XANGARRO!' })).toBeHidden();
    const bar = page.getByRole('navigation', { name: 'Navegación de la caja' }).last();
    await expect(bar.getByRole('link')).toHaveText(['Inicio', 'Cobrar', 'Ventas', 'Mi turno']);
    await expect(bar.getByRole('link', { name: 'Ventas' })).toHaveAttribute('aria-current', 'page');
  });
});
