import { expect, test, type Page } from '@playwright/test';

import {
  clearFounders,
  clearLedgerFixture,
  E2E_CONCEPTO,
  makeSocioFounder,
  resetSocioFixture,
  SOCIO,
} from './founder-fixture';
import { signInAsStaff } from './helpers';

/**
 * «Empresa» (ADR-124). E-01: the area exists only for founders. A staff
 * member who is not one sees no trace of it and gets a 404 from its pages;
 * once corp names them, the group appears with corp's real rows. E-02: a
 * founder records a USD expense, sees it in the month and reverses it.
 *
 * One file, serial: every test here signs in as the same fixture member.
 */
test.describe.configure({ mode: 'serial' });

// Its own client address: the sign-in throttle is per IP, and without this
// header every local request is «unknown» — the auth suite's lockout test,
// running in parallel, would lock this suite out too.
test.use({ extraHTTPHeaders: { 'x-forwarded-for': '203.0.113.24' } });

test.beforeAll(async () => {
  await clearLedgerFixture();
  await resetSocioFixture();
});

test.afterAll(async () => {
  await clearLedgerFixture();
  await clearFounders();
});

const empresaGroup = (page: Page) =>
  page.getByRole('navigation', { name: 'Navegación de la consola' }).getByText('Empresa', {
    exact: true,
  });

test('a staff member who is not a founder sees no «Empresa» and gets a 404', async ({ page }) => {
  await signInAsStaff(page, SOCIO);
  await expect(page.getByRole('link', { name: 'Inicio' })).toBeVisible();
  await expect(empresaGroup(page)).toHaveCount(0);

  const response = await page.goto('/empresa/corporativo');
  expect(response?.status()).toBe(404);
});

test('a founder gets the group and the partners and projects from corp', async ({ page }) => {
  await makeSocioFounder();
  await signInAsStaff(page, SOCIO);
  await expect(empresaGroup(page)).toBeVisible();

  await page.goto('/empresa/corporativo');
  await expect(page.getByRole('heading', { name: 'Libro corporativo' })).toBeVisible();
  // Real rows, not a heading alone: the founder corp names, and corp's seeded project.
  await expect(page.getByText('Fundador 1 · Socia E2E (tú)')).toBeVisible();
  await expect(page.getByText('Xangarro', { exact: true })).toBeVisible();
});

async function registrarGastoEnDolares(page: Page) {
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

test('a founder records a USD expense and reverses it', async ({ page }) => {
  await signInAsStaff(page, SOCIO);
  await page.goto('/empresa');
  await expect(page).toHaveURL(/\/empresa\/movimientos$/);
  await expect(page.getByRole('heading', { name: 'Movimientos', level: 1 })).toBeVisible();

  await registrarGastoEnDolares(page);
  await expect(page).toHaveURL(/\/empresa\/movimientos\?mes=\d{4}-\d{2}$/);
  const row = page.getByTestId('movimiento').filter({ hasText: E2E_CONCEPTO }).first();
  await expect(row).toContainText('−$368.40');
  await expect(row).toContainText('USD 20.00 · TC 18.42 · Vercel Inc.');
  await expect(row).toContainText('Registrado');
  await expect(page.getByTestId('total-salidas')).toContainText('$368.40');

  await row.getByRole('link', { name: E2E_CONCEPTO }).click();
  const linea = (cuenta: string) => page.getByTestId('linea').filter({ hasText: cuenta });
  await expect(linea('Costo del servicio')).toContainText('$368.40');
  await expect(linea('Bancos')).toContainText('$368.40');

  await page
    .getByRole('textbox', { name: '¿Por qué lo reviertes?', exact: true })
    .fill('Duplicado');
  await page.getByRole('button', { name: 'Revertir movimiento' }).click();
  await expect(page.getByRole('link', { name: 'Ver la reversa' })).toBeVisible();

  await page.getByRole('link', { name: 'Volver al mes' }).click();
  const reversa = page.getByTestId('movimiento').filter({ hasText: `Reversa: ${E2E_CONCEPTO}` });
  await expect(reversa).toContainText('Reversa');
  await expect(
    page.getByTestId('movimiento').filter({ hasText: E2E_CONCEPTO }).last(),
  ).toContainText('Revertido');
  // A reversed entry and its reversal cancel: the month's outflow is back to zero.
  await expect(page.getByTestId('total-salidas')).toContainText('$0.00');
});
