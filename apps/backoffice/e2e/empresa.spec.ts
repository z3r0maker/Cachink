import { expect, test, type Page } from '@playwright/test';

import {
  agregarCsd,
  fijarInscripcion,
  inscripcionPasada,
  presentarConAcuse,
} from './empresa-agenda';
import { actualizarMarca, guardarCsd, suscribirAcciones } from './empresa-corporativo';
import { CON_AZURE, prepararAzurite, subirVeinteMegas, verDesdeElAlmacen } from './empresa-blob';
import { adjuntarComprobante, subirActa } from './empresa-expediente';
import { MES, registrarHonorarios, renglon, sembrarCobros } from './empresa-resultados';
import { filaUtilidad, kpi, revisarAutonomia } from './empresa-resumen';
import { abrirEntrada, abrirPestana, rail, RUTAS, secciones } from './empresa-nav';
import {
  adjuntar,
  AGENCIA,
  CONTADORA,
  DESPACHO,
  fijarRfcMexia,
  fila,
  HONORARIOS,
  hoyMx,
  IMPRENTA,
  registrarTres,
  subirCinco,
} from './empresa-facturas';
import {
  E2E_RECURRENTE,
  mesesDePrueba,
  registrarGastoEnDolares,
  registrarLaSugerencia,
  repetirGasto,
} from './empresa-movimientos';
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
  if (CON_AZURE) await prepararAzurite(`http://localhost:${process.env.E2E_PORT ?? 3200}`);
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
  await expect(page.getByRole('heading', { name: 'Cumplimiento', level: 1 })).toBeVisible();
  await expect(
    secciones(page, 'Cumplimiento').getByRole('link', { name: 'Corporativo' }),
  ).toHaveAttribute('aria-current', 'page');
  // Real rows: the founder corp names, and corp's seeded registries.
  await expect(page.getByTestId('tenencia-1')).toContainText('Fundador 1 · Socia E2E');
  await expect(page.getByTestId('registro').filter({ hasText: 'Marca Xangarro' })).toBeVisible();
});

test('a founder records a USD expense and reverses it', async ({ page }) => {
  await signInAsStaff(page, SOCIO);
  await page.goto('/empresa/movimientos');
  await expect(page.getByRole('heading', { name: 'Dinero', level: 1 })).toBeVisible();

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

test('a founder repeats an expense, registers its next charge and stops it', async ({ page }) => {
  await signInAsStaff(page, SOCIO);
  const { actual, anterior } = mesesDePrueba();
  await repetirGasto(page, anterior);
  await expect(page.getByTestId('movimiento').filter({ hasText: E2E_RECURRENTE })).toContainText(
    'Registrado',
  );

  // This month the 1st has come: the charge is suggested, and posts nothing yet.
  await registrarLaSugerencia(page, actual);
  await expect(page.getByTestId('movimiento').filter({ hasText: E2E_RECURRENTE })).toContainText(
    '−$3,500.00',
  );
  await expect(
    page.getByTestId('movimiento-sugerido').filter({ hasText: E2E_RECURRENTE }),
  ).toHaveCount(0);

  await page.getByRole('link', { name: /^Recurrentes · \d+$/ }).click();
  const fila = page.getByTestId('recurrente').filter({ hasText: E2E_RECURRENTE });
  await expect(fila).toContainText('Registrado');
  await expect(fila).toContainText('$3,500.00');
  await fila.getByRole('button', { name: `Dejar de repetir ${E2E_RECURRENTE}` }).click();
  await expect(fila).toContainText('ya no se repite');
  await expect(fila.getByRole('button', { name: /Dejar de repetir/ })).toHaveCount(0);
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
  await abrirEntrada(page, 'Cumplimiento');
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
  await abrirEntrada(page, 'Cumplimiento');
  await abrirPestana(page, 'Expediente', /\/empresa\/expediente$/);
  // The acuse filed on the Agenda is here, linked to its obligation.
  await expect(
    page.getByTestId('documento-expediente').filter({ hasText: 'Acuse · ISR provisional' }),
  ).toContainText('Agenda · ISR provisional');
  await subirActa(page);
  await adjuntarComprobante(page);
});

test('a founder records shares, updates a registry and keeps a CSD expiry', async ({ page }) => {
  await signInAsStaff(page, SOCIO);
  await abrirEntrada(page, 'Cumplimiento');
  await abrirPestana(page, 'Corporativo', /\/empresa\/corporativo$/);
  await suscribirAcciones(page);
  await actualizarMarca(page);
  await guardarCsd(page);
  // The share event put its 15-business-day notice on the Agenda.
  await abrirPestana(page, 'Agenda', /\/empresa\/agenda$/);
  await expect(
    page.getByTestId('obligacion').filter({ hasText: 'Beneficiario controlador' }),
  ).toBeVisible();
});

test('a founder uploads invoices, registers three, pays one on credit and cancels another', async ({
  page,
}) => {
  await fijarRfcMexia();
  await signInAsStaff(page, SOCIO);
  await abrirEntrada(page, 'Dinero');
  await abrirPestana(page, 'Facturas', /\/empresa\/facturas$/, 'Dinero');
  await expect(page.getByRole('heading', { name: 'Facturas recibidas en' })).toBeVisible();

  const honorarios = await subirCinco(page);
  await expect(page.getByRole('heading', { name: 'Revisa antes de registrar' })).toBeVisible();
  await expect(
    page.getByText('Subiste 5 archivos. 3 están listos; 2 no se registran'),
  ).toBeVisible();
  const fuera = page.getByTestId('factura-fuera');
  await expect(fuera.filter({ hasText: 'No es de MEXIA' })).toContainText('Pídele al proveedor');
  await expect(fuera.filter({ hasText: 'Cancelada' })).toContainText('El SAT la reporta cancelada');
  await expect(page.getByRole('article', { name: HONORARIOS })).toContainText('Se pagó$3,336.67');
  await registrarTres(page);

  // Real rows: the XML's figures, the SAT's word and where each one went.
  await expect(fila(page, HONORARIOS)).toContainText('−$723.33');
  await expect(fila(page, HONORARIOS)).toContainText('Vigente');
  await expect(fila(page, HONORARIOS).getByRole('link', { name: 'Administración' })).toBeVisible();
  await expect(fila(page, AGENCIA.nombre)).toContainText('Cancelada');
  await expect(fila(page, AGENCIA.nombre)).toContainText('No se registró');
  await expect(page.getByTestId('facturas-recibidas')).toContainText('2 por pagar: $8,700.00');
  await expect(page.getByTestId('facturas-retenciones')).toContainText('$723.33');

  // Owner decision 9: the invoice on credit is paid; the other one came wrong.
  await page.getByRole('button', { name: `Registrar pago a ${DESPACHO.nombre}` }).click();
  await expect(fila(page, DESPACHO.nombre)).toContainText('a crédito, pagada');
  await page.getByRole('button', { name: `Cancelar la factura de ${IMPRENTA.nombre}` }).click();
  await expect(fila(page, IMPRENTA.nombre)).toContainText('Se revirtió');
  await expect(page.getByTestId('facturas-recibidas')).toContainText('Ninguna por pagar');

  // The same XML again is refused, pointing at its movement; leaving the review keeps nothing.
  await page.getByLabel('Elegir archivos').setInputFiles(honorarios);
  await expect(
    page.getByTestId('factura-fuera').filter({ hasText: 'Ya registrada' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver movimiento' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page).toHaveURL(/\/empresa\/facturas$/);
});

test('a founder attaches one XML on Registrar gasto, rewords it and registers it', async ({
  page,
}) => {
  await fijarRfcMexia();
  await signInAsStaff(page, SOCIO);
  // Through the links, as a founder gets there: a file chosen before the page hydrates is lost.
  await abrirEntrada(page, 'Dinero');
  await page.getByRole('link', { name: '+ Registrar' }).click();
  await expect(page.getByRole('heading', { name: 'Registrar', level: 1 })).toBeVisible();

  // Another RFC's invoice is refused right there, with the review's reason.
  await adjuntar(page, 'papeleria.xml', { receptor: 'OTR010101AA1' });
  await expect(page.getByRole('alert').filter({ hasText: 'No es de MEXIA' })).toContainText(
    'Está a nombre de otro RFC',
  );

  // «Quitar» sets the XML aside and gives back the blank form.
  await adjuntar(page, 'quitar.xml', { emisor: CONTADORA, concepto: 'Para quitar' });
  await expect(page.getByText('quitar.xml leído · vigente en el SAT')).toBeVisible();
  await page.getByRole('button', { name: 'Quitar' }).click();
  await expect(page.getByRole('heading', { name: 'Registrar', level: 1 })).toBeVisible();

  await adjuntar(page, 'contadora.xml', { emisor: CONTADORA });
  await expect(page.getByText('contadora.xml leído · vigente en el SAT')).toBeVisible();
  await expect(page.getByLabel('Proveedor')).toHaveValue(
    `${CONTADORA.nombre} · RFC ${CONTADORA.rfc}`,
  );
  const delXml = page.getByRole('region', { name: 'Del XML' });
  await expect(delXml).toContainText('IVA retenido−$373.33');
  await expect(delXml).toContainText('Salió del banco$3,336.67');
  await expect(delXml).toContainText('la declaración del 17 de');
  await page.getByLabel('Concepto').fill('Honorarios E2E de octubre');
  await page.getByLabel('Fecha de pago').fill(hoyMx());
  await page.getByText('Administración', { exact: true }).click();
  await page.getByRole('button', { name: 'Registrar gasto' }).click();

  // Real rows: the movement in its month, and the invoice in Facturas, pointing at it.
  await expect(page).toHaveURL(/\/empresa\/movimientos\?mes=\d{4}-\d{2}$/);
  await expect(page.getByText('Honorarios E2E de octubre')).toBeVisible();
  await page.goto('/empresa/facturas');
  await expect(fila(page, CONTADORA.nombre)).toContainText('Vigente');
  await expect(fila(page, CONTADORA.nombre)).toContainText('−$723.33');
  await expect(
    fila(page, CONTADORA.nombre).getByRole('link', { name: 'Administración' }),
  ).toBeVisible();
});

test('a founder moves through Empresa by its entries and tabs (E-07)', async ({ page }) => {
  await signInAsStaff(page, SOCIO);
  // The rail shows the built entries; their screens are tabs, not entries.
  for (const entrada of ['Resumen', 'Dinero', 'Resultados', 'Socios', 'Cumplimiento']) {
    await expect(rail(page).getByRole('link', { name: entrada, exact: true })).toBeVisible();
  }
  for (const pantalla of ['Movimientos', 'Facturas', 'Agenda', 'Expediente', 'Corporativo']) {
    await expect(rail(page).getByRole('link', { name: pantalla, exact: true })).toHaveCount(0);
  }

  // Cumplimiento: three tabs, each with the rows earlier tests left.
  await abrirEntrada(page, 'Cumplimiento');
  await expect(page).toHaveURL(/\/empresa\/agenda$/);
  await expect(secciones(page, 'Cumplimiento').getByRole('link')).toHaveText([
    'Agenda',
    'Expediente',
    'Corporativo',
  ]);
  await expect(
    page.getByTestId('obligacion').filter({ hasText: 'Beneficiario controlador' }),
  ).toBeVisible();
  await abrirPestana(page, 'Expediente', /\/empresa\/expediente$/);
  await expect(
    page.getByTestId('documento-expediente').filter({ hasText: 'Acuse · ISR provisional' }),
  ).toBeVisible();
  await abrirPestana(page, 'Corporativo', /\/empresa\/corporativo$/);
  await expect(page.getByTestId('tenencia-1')).toContainText('Fundador 1 · Socia E2E');
  // A sub-page keeps its entry lit.
  await page.getByRole('link', { name: 'Registrar acciones' }).click();
  await expect(rail(page).getByRole('link', { name: 'Cumplimiento', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );

  // Dinero: Movimientos and Facturas.
  await abrirEntrada(page, 'Dinero');
  await expect(page).toHaveURL(/\/empresa\/movimientos/);
  await expect(secciones(page, 'Dinero').getByRole('link')).toHaveText(['Movimientos', 'Facturas']);
  await abrirPestana(page, 'Facturas', /\/empresa\/facturas$/, 'Dinero');

  // One built tab is no choice: Resultados and Socios draw no bar.
  await abrirEntrada(page, 'Resultados');
  await expect(page).toHaveURL(/\/empresa\/resultados$/);
  await expect(page.getByRole('navigation', { name: /^Secciones de / })).toHaveCount(0);
  await abrirEntrada(page, 'Socios');
  await expect(page).toHaveURL(/\/empresa\/socios$/);
  await expect(page.getByRole('navigation', { name: /^Secciones de / })).toHaveCount(0);

  // Every URL the area had still opens its screen.
  for (const [ruta, titulo] of RUTAS) {
    const response = await page.goto(ruta);
    expect(response?.status(), ruta).toBe(200);
    await expect(page.getByRole('heading', { name: titulo, level: 1 })).toBeVisible();
  }
});

test('a founder files a 20 MB document straight to the blob store (E-26)', async ({ page }) => {
  test.skip(!CON_AZURE, 'needs CORP_BLOB_* pointed at a blob store (Azurite locally)');
  test.setTimeout(180_000);
  await signInAsStaff(page, SOCIO);
  const id = await subirVeinteMegas(page);
  await expect(
    page.getByTestId('documento-expediente').filter({ hasText: 'E2E Deck de 20 MB' }),
  ).toBeVisible();
  await verDesdeElAlmacen(page, id);
});

test('a founder reads a month of results, opens a line, and switches basis and period (E-12)', async ({
  page,
}) => {
  await sembrarCobros();
  await signInAsStaff(page, SOCIO);
  await registrarHonorarios(page);
  await abrirEntrada(page, 'Resultados');
  await expect(page.getByRole('heading', { name: 'Resultados', level: 1 })).toBeVisible();

  // Real rows: two cobros the use case posted and the fee Registrar took, worked by hand.
  await page.goto(`/empresa/resultados?periodo=${MES}`);
  await expect(page.getByText('Marzo de 2024 vs febrero')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'De $10,000 de ingresos a $4,900 de utilidad' }),
  ).toBeVisible();
  await expect(renglon(page, 'ingresos')).toContainText('$10,000.00');
  await expect(renglon(page, 'administracion')).toContainText('($3,000.00)');
  await expect(renglon(page, 'ebitda')).toContainText('$7,000.00');
  await expect(renglon(page, 'ebitda')).toContainText('70.0 %');
  await expect(renglon(page, 'isr_estimado')).toContainText('($2,100.00)');
  await expect(renglon(page, 'utilidad_neta')).toContainText('$4,900.00');
  await expect(page.getByText('De $8,000 en febrero a $7,000 en marzo.')).toBeVisible();
  await expect(page.getByTestId('puente-paso')).toHaveCount(4);

  // A line opens into the movements behind it.
  await renglon(page, 'administracion').getByRole('link').click();
  await expect(
    page.getByTestId('estado-movimiento').filter({ hasText: 'E2E Contador de marzo' }),
  ).toContainText('($3,000.00)');

  await page.getByRole('navigation', { name: 'Base' }).getByRole('link', { name: 'Flujo' }).click();
  await expect(page.getByText('Flujo: lo cobrado y pagado')).toBeVisible();
  await expect(renglon(page, 'ebitda')).toContainText('$7,000.00');
  await page
    .getByRole('navigation', { name: 'Periodo' })
    .getByRole('link', { name: 'Trimestre' })
    .click();
  await expect(page).toHaveURL(/periodo=2024-T1/);
  await expect(renglon(page, 'ingresos')).toContainText('$18,000.00');
});

test('a founder opens Empresa on its Resumen and follows a tile and a signal (E-16)', async ({
  page,
}) => {
  await signInAsStaff(page, SOCIO);
  await abrirEntrada(page, 'Resumen');
  await expect(page).toHaveURL(/\/empresa$/);
  await expect(page.getByRole('heading', { name: 'Resumen', level: 1 })).toBeVisible();
  // Autonomía is today's cash: every movement the earlier tests left.
  await revisarAutonomia(page);

  // Real rows: E-12's March, two cobros and the contador's fee, worked by hand.
  await page.goto(`/empresa?periodo=${MES}`);
  await expect(page.getByText('Marzo de 2024', { exact: true })).toBeVisible();
  await expect(kpi(page, 'Ingresos netos')).toContainText('$10,000');
  await expect(kpi(page, 'Ingresos netos')).toContainText('+$2,000 vs febrero');
  await expect(kpi(page, 'Margen bruto')).toContainText('Sin datos de febrero');
  await expect(kpi(page, 'EBITDA')).toContainText('$7,000');
  await expect(kpi(page, 'Utilidad neta')).toContainText('$4,900');
  await expect(kpi(page, 'Utilidad neta')).toContainText('Después de ISR estimado');
  await expect(page.getByTestId('utilidad-fila')).toHaveCount(8);
  await expect(filaUtilidad(page, 'Administración')).toContainText('−$3,000');
  await expect(filaUtilidad(page, 'ISR estimado')).toContainText('−$2,100');
  await expect(
    page.getByText('Los costos de marzo suman $3,000: 30 % de los ingresos.'),
  ).toBeVisible();
  // E-04's Agenda puts its next items here; the late ones are signals.
  await expect(page.getByTestId('vencimiento').first()).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Periodo' })
    .getByRole('link', { name: 'Trimestre' })
    .click();
  await expect(page).toHaveURL(/periodo=2024-T1/);
  await expect(kpi(page, 'Ingresos netos')).toContainText('$18,000');
  await kpi(page, 'Ingresos netos').click();
  await expect(page).toHaveURL(/\/empresa\/resultados\?periodo=2024-T1$/);

  // E-06's CSD, 41 days out, is a signal that opens the certificates.
  await page.goto('/empresa');
  const csd = page.getByTestId('senal').filter({ hasText: 'El CSD vence en 41 días' });
  await expect(csd).toContainText('Si vence, no se puede facturar.');
  await csd.getByRole('link', { name: 'Ver certificados' }).click();
  await expect(page).toHaveURL(/\/empresa\/corporativo$/);
});
