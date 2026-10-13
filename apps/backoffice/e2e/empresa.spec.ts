import { expect, test, type Page } from '@playwright/test';

import {
  agregarCsd,
  fijarInscripcion,
  inscripcionPasada,
  presentarConAcuse,
} from './empresa-agenda';
import { actualizarMarca, guardarCsd, suscribirAcciones } from './empresa-corporativo';
import { adjuntarComprobante, subirActa } from './empresa-expediente';
import { registrarGastoEnDolares } from './empresa-movimientos';
import {
  clearFounders,
  clearLedgerFixture,
  devolverEmpresa,
  E2E_CONCEPTO,
  makeSocioFounder,
  resetSocioFixture,
  sacarEmpresa,
  SOCIO,
} from './founder-fixture';
import {
  cerrarElTrimestre,
  pedirYPagarFondeo,
  registrarDineroDeSocio,
  trimestrePasado,
} from './empresa-socios';
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

let empresa: Awaited<ReturnType<typeof sacarEmpresa>> | null = null;

test.beforeAll(async () => {
  await clearLedgerFixture();
  await resetSocioFixture();
  empresa = await sacarEmpresa();
});

test.afterAll(async () => {
  await clearLedgerFixture();
  await clearFounders();
  if (empresa !== null) await devolverEmpresa(empresa);
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
  // Real rows: the founder corp names, and corp's seeded registries.
  await expect(page.getByTestId('tenencia-1')).toContainText('Fundador 1 · Socia E2E');
  await expect(page.getByTestId('registro').filter({ hasText: 'Marca Xangarro' })).toBeVisible();
});

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

test('a founder funds by halves, puts in more and closes the quarter', async ({ page }) => {
  await signInAsStaff(page, SOCIO);
  await page.getByRole('link', { name: 'Socios', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cuentas de socios', level: 1 })).toBeVisible();
  await pedirYPagarFondeo(page);

  const pasado = trimestrePasado();
  await registrarDineroDeSocio(page, {
    concepto: 'E2E Aportación adicional',
    clase: 'Aportación adicional',
    monto: '30000',
    fecha: pasado.fecha,
  });
  await expect(page).toHaveURL(/\/empresa\/socios$/);
  await expect(page.getByTestId('cuenta-1')).toContainText('Aportaciones adicionales$30,000.00');

  // A repayment with no loan on the books is refused, with the reason.
  await registrarDineroDeSocio(page, {
    concepto: 'E2E Reembolso',
    clase: 'Reembolso de préstamo',
    monto: '1000',
    fecha: pasado.fecha,
  });
  await expect(page.getByText('Ese socio no tiene préstamos por reembolsar.')).toBeVisible();

  await page.goto('/empresa/socios');
  await cerrarElTrimestre(page, pasado.nombre);
  await expect(page.getByTestId('cuenta-1')).toContainText('Aportaciones adicionales$20,000.00');
  await expect(page.getByTestId('cuenta-1')).toContainText('Préstamos a la empresa$10,000.00');
  // The close is in the history, dated the quarter's last day.
  await expect(
    page.getByTestId('movimiento-socio').filter({ hasText: 'Excedente a préstamo' }),
  ).toContainText('$10,000.00');
});

test('a founder files an obligation with its acuse and adds an expiry', async ({ page }) => {
  await signInAsStaff(page, SOCIO);
  await page.getByRole('link', { name: 'Agenda', exact: true }).click();
  const inscripcion = inscripcionPasada();
  await fijarInscripcion(page, inscripcion.fecha);
  await expect(page.getByTestId('exenta').filter({ hasText: 'DIOT' })).toContainText(
    'RESICO persona moral está relevada',
  );

  const tarde = page.getByTestId('obligacion').filter({ hasText: 'ISR provisional' }).first();
  await expect(tarde).toContainText('vencida hace');
  await tarde.getByRole('link').click();
  await expect(
    page.getByRole('heading', { name: `ISR provisional de ${inscripcion.mes}`, level: 1 }),
  ).toBeVisible();
  await presentarConAcuse(page);

  await page.getByRole('link', { name: 'Volver a la agenda' }).click();
  await agregarCsd(page);
  // The proof shows on Evidencias too.
  await page.getByRole('link', { name: 'Evidencias' }).click();
  await expect(
    page.getByTestId('fila-evidencia').filter({ hasText: 'ISR provisional' }),
  ).toContainText('✓ Acuse');
});

test('a founder files papers, versions one and attaches a proof to a movement', async ({
  page,
}) => {
  await signInAsStaff(page, SOCIO);
  await page.getByRole('link', { name: 'Expediente', exact: true }).click();
  // The acuse filed on the Agenda is here, linked to its obligation.
  await expect(
    page.getByTestId('documento-expediente').filter({ hasText: 'Acuse · ISR provisional' }),
  ).toContainText('Agenda · ISR provisional');
  await subirActa(page);
  await adjuntarComprobante(page);
});

test('a founder records shares, updates a registry and keeps a CSD expiry', async ({ page }) => {
  await signInAsStaff(page, SOCIO);
  await page.getByRole('link', { name: 'Corporativo', exact: true }).click();
  await suscribirAcciones(page);
  await actualizarMarca(page);
  await guardarCsd(page);
  // The share event put its 15-business-day notice on the Agenda.
  await page.getByRole('link', { name: 'Agenda', exact: true }).click();
  await expect(
    page.getByTestId('obligacion').filter({ hasText: 'Beneficiario controlador' }),
  ).toBeVisible();
});
