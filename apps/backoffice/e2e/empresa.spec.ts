import { expect, test, type Page } from '@playwright/test';

import { formatMoney, formatMonth, toPesosString } from '@xangarro/domain';

import { agregarCsd, fijarInscripcion, inscripcionPasada } from './empresa-agenda';
import { capturarDeclaracion, esperadoDe, sembrarMesFiscal, subirPapel } from './empresa-impuestos';
import { actualizarMarca, guardarCsd, suscribirAcciones } from './empresa-corporativo';
import { CON_AZURE, prepararAzurite, subirVeinteMegas, verDesdeElAlmacen } from './empresa-blob';
import { stamp } from './consola-fixture';
import { abrirMenu, menu, sinScrollLateral, TELEFONO } from './consola-telefono';
import { adjuntarComprobante, subirActa } from './empresa-expediente';
import { cuentaDelBalance, MES_BALANCE, sembrarBalance } from './empresa-balance';
import { asegurarTopes, hoyEnMexico, quitarTopes, sembrarCobroDelAnio } from './empresa-limites';
import { MES, registrarHonorarios, renglon, sembrarCobros } from './empresa-resultados';
import { mesAnterior, nuevoServicioPorUso, registrarCargoDe } from './empresa-servicios';
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
  DISENADOR,
  fijarEstadoSat,
  HOSTING,
  MENSAJERIA,
  registrarParaConsultar,
} from './empresa-sat';
import { MENSUAL, recurrente, registrarMensual } from './empresa-recurrente-factura';
import {
  ABARROTES,
  importarCobros,
  ITEM_GLOBAL,
  ITEM_MANUAL,
  limpiarPagos,
  PAPELERIA,
  reembolsarTaqueria,
  sembrarPagos,
  TAQUERIA,
} from './empresa-emitidas';
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
import { E2E_HOSTING, esperadoDeCaja, hoyMx as hoyCaja, sembrarCargoProximo } from './empresa-caja';
import {
  E2E_CAMPANA,
  esperadoDePresupuesto,
  hoyMx as hoyPresupuesto,
  otroSocioPide,
  otroSocioRechazaYPrepara,
  trimestreMx,
} from './empresa-presupuesto';
import { bajarPaquete, capturarCodigos, codigoDe, MES_CONTADOR } from './empresa-contador';
import {
  hoy as hoyTablero,
  nombre as nombreT,
  otroApruebaPlan,
  otroObjeta,
  otroPoneValor,
  primerDia,
  sembrarCierre,
  TABLERO_ACTUAL,
  TABLERO_CERRADO,
  TABLERO_SIGUIENTE,
} from './empresa-tablero';
import {
  agregarOtroSocio,
  confirmarSaldo,
  esperarPaso,
  MES_CIERRE,
  OTRO_SOCIO,
  otroSocioRechazaYPide,
  quitarOtroSocio,
  registrarEnMesCerrado,
  sembrarMesCierre,
  subirEstados,
} from './empresa-cierre';

/**
 * «Empresa» (ADR-125). E-01: the area exists only for founders. A staff
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
  await expect(row).toContainText('−$372.10');
  await expect(row).toContainText('USD 20.00 · el banco cobró a 18.6050 · Vercel Inc.');
  await expect(row).toContainText('Registrado');
  await expect(page.getByTestId('total-salidas')).toContainText('$372.10');

  await row.getByRole('link', { name: E2E_CONCEPTO }).click();
  const linea = (cuenta: string) => page.getByTestId('linea').filter({ hasText: cuenta });
  await expect(linea('Costo del servicio')).toContainText('$372.10');
  await expect(linea('Bancos')).toContainText('$372.10');

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
  await expect(page.getByRole('heading', { name: 'Socios', level: 1 })).toBeVisible();
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

  const tarde = page.getByTestId('obligacion').filter({ hasText: 'ISR e IVA' }).first();
  await expect(tarde).toContainText('vencida hace');
  await tarde.getByRole('link').click();
  await expect(
    page.getByRole('heading', { name: `ISR e IVA de ${inscripcion.mes}`, level: 1 }),
  ).toBeVisible();
  // The monthly declaration is filed from Impuestos (E-13): this one en ceros, with its acuse.
  await page.getByRole('link', { name: 'Declarar y pagar en Impuestos' }).click();
  await expect(page).toHaveURL(/\/empresa\/impuestos\?mes=\d{4}-\d{2}$/);
  await capturarDeclaracion(page, { isr: 0n, iva: 0n, retencionIsr: 0n, retencionIva: 0n }, false);
  await subirPapel(page, 'Acuse de la declaración', 'acuse-e2e.pdf');
  // «Ver» serves the very bytes that were kept.
  const ver = page
    .getByTestId('papel')
    .filter({ hasText: 'Acuse' })
    .getByRole('link', { name: 'Ver' });
  const res = await page.request.get((await ver.getAttribute('href')) ?? '');
  expect(res.status()).toBe(200);
  expect((await res.body()).toString('utf8')).toContain('de prueba');
  await page.getByRole('button', { name: 'Marcar como pagado' }).click();
  await expect(page.getByTestId('impuestos-estado')).toHaveText('Presentada en ceros');

  await page.goto('/empresa/agenda');
  await agregarCsd(page);
  // The proof shows on Evidencias too.
  await page.getByRole('link', { name: 'Evidencias' }).click();
  await expect(page.getByTestId('fila-evidencia').filter({ hasText: 'ISR e IVA' })).toContainText(
    '✓ Acuse',
  );
});

test('a founder files papers, versions one and attaches a proof to a movement', async ({
  page,
}) => {
  await signInAsStaff(page, SOCIO);
  await abrirEntrada(page, 'Cumplimiento');
  await abrirPestana(page, 'Expediente', /\/empresa\/expediente$/);
  // The acuse filed on the Agenda is here, linked to its obligation.
  await expect(
    page.getByTestId('documento-expediente').filter({ hasText: 'Acuse · ISR e IVA' }),
  ).toContainText('Agenda · ISR e IVA');
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

  // Owner decision 9: the invoice on credit is paid on a date (CD-06e); the other one came wrong
  // and is cancelled once confirmed (CD-06f).
  await page.getByRole('button', { name: `Registrar pago a ${DESPACHO.nombre}` }).click();
  const pago = page.getByRole('form', { name: `Registrar el pago a ${DESPACHO.nombre}` });
  await expect(pago).toContainText('Sale del banco$4,640.00');
  const fecha = pago.getByLabel('Fecha de pago');
  await expect(fecha).toHaveValue(hoyMx());
  await expect(fecha).toHaveAttribute('min', `${hoyMx().slice(0, 7)}-01`);
  await expect(fecha).toHaveAttribute('max', hoyMx());
  await pago.getByRole('button', { name: 'No, regresar' }).click();
  await expect(pago).toBeHidden();
  await page.getByRole('button', { name: `Registrar pago a ${DESPACHO.nombre}` }).click();
  await pago.getByRole('button', { name: 'Confirmar pago' }).click();
  await expect(fila(page, DESPACHO.nombre)).toContainText('a crédito, pagada el');

  await page.getByRole('button', { name: `Cancelar la factura de ${IMPRENTA.nombre}` }).click();
  const cancelar = page.getByRole('form', { name: `¿Cancelar la factura de ${IMPRENTA.nombre}?` });
  await expect(cancelar).toContainText('No se puede deshacer');
  await cancelar.getByRole('button', { name: 'Sí, cancelar la factura' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Factura cancelada' })).toBeVisible();
  await expect(fila(page, IMPRENTA.nombre)).toContainText('a crédito, cancelada el');
  await expect(fila(page, IMPRENTA.nombre).getByRole('link', { name: 'Revertido' })).toBeVisible();
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
  for (const pantalla of [
    'Movimientos',
    'Facturas',
    'Servicios',
    'Caja',
    'Agenda',
    'Cierre del mes',
    'Expediente',
    'Corporativo',
  ]) {
    await expect(rail(page).getByRole('link', { name: pantalla, exact: true })).toHaveCount(0);
  }

  // Cumplimiento: four tabs, each with the rows earlier tests left.
  await abrirEntrada(page, 'Cumplimiento');
  await expect(page).toHaveURL(/\/empresa\/agenda$/);
  await expect(secciones(page, 'Cumplimiento').getByRole('link')).toHaveText([
    'Agenda',
    'Cierre del mes',
    'Expediente',
    'Corporativo',
  ]);
  await expect(
    page.getByTestId('obligacion').filter({ hasText: 'Beneficiario controlador' }),
  ).toBeVisible();
  await abrirPestana(page, 'Expediente', /\/empresa\/expediente$/);
  await expect(
    page.getByTestId('documento-expediente').filter({ hasText: 'Acuse · ISR e IVA' }),
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
  await expect(secciones(page, 'Dinero').getByRole('link')).toHaveText([
    'Movimientos',
    'Facturas',
    'Servicios',
    'Caja',
  ]);
  await abrirPestana(page, 'Facturas', /\/empresa\/facturas$/, 'Dinero');

  // Resultados: the statement and the balance sheet.
  await abrirEntrada(page, 'Resultados');
  await expect(page).toHaveURL(/\/empresa\/resultados$/);
  await expect(secciones(page, 'Resultados').getByRole('link')).toHaveText([
    'Estado de resultados',
    'Balance',
    'Impuestos',
    'Presupuesto',
  ]);
  await abrirPestana(page, 'Balance', /\/empresa\/balance$/, 'Resultados');

  // One built tab is no choice: Socios draws no bar.
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

test('a founder reads a balance sheet that balances, opens an account and walks back (E-12)', async ({
  page,
}) => {
  await sembrarBalance();
  await signInAsStaff(page, SOCIO);
  await page.goto(`/empresa/balance?mes=${MES_BALANCE}`);
  await expect(page.getByText('Al 30 de junio de 2023')).toBeVisible();

  // Real rows, worked by hand in empresa-balance.ts.
  const cuadre = page.getByTestId('balance-cuadre');
  await expect(cuadre).toContainText('$9,160.00 = $2,160.00 + $7,000.00');
  await expect(cuadre).toContainText('Cuadra');
  await expect(cuentaDelBalance(page, 'bancos')).toContainText('$9,160.00');
  await expect(cuentaDelBalance(page, 'bancos')).toContainText('$6,000.00');
  await expect(cuentaDelBalance(page, 'iva_trasladado')).toContainText('$160.00');
  await expect(cuentaDelBalance(page, 'prestamos_socios')).toContainText('$2,000.00');
  await expect(cuentaDelBalance(page, 'resultado')).toContainText('$1,000.00');
  await expect(page.getByTestId('balance-socio-F1')).toContainText('$6,000.00');
  await expect(page.getByTestId('balance-socio-F2')).toContainText('$2,000.00');
  await expect(page.getByTestId('balance-socio-total')).toContainText('$8,000.00');

  // An account opens into its month; the year's result opens Resultados.
  await cuentaDelBalance(page, 'bancos').click();
  await expect(page).toHaveURL(/abrir=bancos/);
  await expect(page.getByTestId('balance-movimiento')).toHaveCount(2);
  await expect(page.getByTestId('balance-movimiento').first()).toContainText('E2E Balance cobro');
  await expect(page.getByTestId('balance-movimiento').first()).toContainText('$1,160.00');
  await cuentaDelBalance(page, 'resultado').click();
  await expect(page).toHaveURL(/\/empresa\/resultados\?periodo=2023$/);

  // May holds the capital alone; April, nothing yet.
  await page.goto('/empresa/balance?mes=2023-05');
  await expect(page.getByTestId('balance-cuadre')).toContainText('$6,000.00 = $0.00 + $6,000.00');
  await page.getByRole('link', { name: 'Mes anterior' }).click();
  await expect(page).toHaveURL(/mes=2023-04/);
  await expect(
    page.getByRole('heading', { name: 'Aún no hay movimientos al 30 de abril' }),
  ).toBeVisible();
});

test('a founder checks a month’s taxes against the contador, then files and pays them (E-13)', async ({
  page,
}) => {
  const mes = mesAnterior();
  await sembrarMesFiscal(mes);
  const e = await esperadoDe(mes);
  await signInAsStaff(page, SOCIO);
  await page.goto('/empresa/resultados');
  await abrirPestana(page, 'Impuestos', /\/empresa\/impuestos$/, 'Resultados');

  // Real data: the ledger's month reaches the total and the cards.
  await expect(page.getByTestId('impuestos-total')).toHaveText(formatMoney(e.total));
  await expect(page.getByTestId('tarjeta-iva')).toContainText(formatMoney(e.iva.trasladado));
  await expect(page.getByTestId('tarjeta-retenciones')).toContainText(
    formatMoney(e.retenciones.total),
  );

  // The contador declared $46.00 more IVA: flagged, never blocked.
  const cifras = {
    isr: e.isr.aPagar,
    iva: e.iva.aPagar,
    retencionIsr: e.retenciones.isr,
    retencionIva: e.retenciones.iva,
  };
  await capturarDeclaracion(page, { ...cifras, iva: cifras.iva + 46_00n }, true);
  await expect(page.getByTestId('impuestos-estado')).toHaveText('Revisa con el contador');
  await expect(
    page.getByText('Revisa con el contador: el IVA no coincide por $46.00'),
  ).toBeVisible();
  await expect(page.getByTestId('tarjeta-iva').getByTestId('diferencia')).toHaveText('+$46.00');

  // «Marcar como pagado» waits for the acuse, then for the comprobante.
  const pagar = page.getByRole('button', { name: 'Marcar como pagado' });
  await expect(pagar).toBeDisabled();
  await subirPapel(page, 'Acuse de la declaración', 'acuse-impuestos.pdf');
  await capturarDeclaracion(page, cifras, false);
  await expect(page.getByTestId('impuestos-estado')).toHaveText('Presentada · falta el pago');
  await expect(pagar).toBeDisabled();
  await expect(page.getByText('Sube el comprobante para marcarla pagada.')).toBeVisible();
  await subirPapel(page, 'Comprobante de pago', 'spei-impuestos.pdf');
  await pagar.click();
  await expect(page.getByTestId('impuestos-estado')).toHaveText('Pagado');

  // The payment is a movement, and an old link finds the Agenda's «ISR e IVA», paid.
  await page.getByRole('link', { name: 'Ver el pago en Movimientos' }).click();
  await expect(
    page.getByTestId('movimiento').filter({ hasText: 'ISR e IVA de' }).first(),
  ).toContainText(formatMoney(e.total));
  await page.goto(`/empresa/agenda/isr_mensual/${mes}`);
  await expect(page).toHaveURL(new RegExp(`/empresa/agenda/impuestos_mensual/${mes}$`));
  await expect(page.getByTestId('estado')).toHaveText('Pagada');
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

test('a founder reads the year’s limits from the Resumen, and captures caps a year lacks (E-15)', async ({
  page,
}) => {
  const hoy = hoyEnMexico();
  const anio = hoy.slice(0, 4);
  await asegurarTopes(anio);
  await sembrarCobroDelAnio(hoy);
  await signInAsStaff(page, SOCIO);
  await page.goto('/empresa');
  const tile = page.getByTestId('kpi').filter({ hasText: 'Tope de la SAS' });
  await expect(tile).toContainText('de $7.68 M');

  // The tile opens the drawer; its project sits beside Xangarro's in one gauge.
  await tile.click();
  await expect(page).toHaveURL(/limites=1/);
  const cajon = page.getByRole('dialog', { name: new RegExp(`^${anio}, a `) });
  await expect(cajon.getByTestId('limite-sas')).toContainText('de $7,678,849.94');
  await expect(cajon.getByTestId('limite-resico')).toContainText('de $35,000,000.00');
  await expect(cajon.getByTestId('limite-fuente').filter({ hasText: 'E2E Límites' })).toContainText(
    '$1,234.00',
  );
  await expect(cajon.getByTestId(`tope-${anio}`)).toContainText('$7,678,849.94');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/empresa\?periodo=/);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // A year without its caps says so, and asks for them: last year's are never used.
  await quitarTopes(anio);
  await page.goto('/empresa');
  await expect(
    page.getByTestId('senal').filter({ hasText: `Faltan los topes de ${anio}` }),
  ).toBeVisible();
  await expect(tile).toContainText(`Falta ${anio}`);
  await tile.click();
  const sin = page.getByRole('dialog', { name: anio, exact: true });
  await sin.getByLabel(`Tope de la SAS para ${anio}`).fill('7678849.94');
  await sin.getByLabel(`Tope de RESICO persona moral para ${anio}`).fill('35000000');
  await sin.getByRole('button', { name: `Guardar los topes de ${anio}` }).click();
  await expect(page.getByRole('dialog').getByTestId('limite-sas')).toContainText(
    'de $7,678,849.94',
  );
});

test('a founder adds a usage service, reads what it cost, edits it and drops it (E-24)', async ({
  page,
}) => {
  const nombre = `E2E Azure ${stamp()}`;
  await signInAsStaff(page, SOCIO);
  await page.goto('/empresa/movimientos');
  await abrirPestana(page, 'Servicios', /\/empresa\/servicios$/, 'Dinero');
  await nuevoServicioPorUso(page, nombre);
  await expect(page.getByRole('heading', { level: 1, name: nombre })).toBeVisible();
  await expect(page.getByTestId('servicio-recurrente')).toContainText('Cada día 3, sin monto fijo');

  // Real data: last month's charge against its template is its average and its first expense.
  await registrarCargoDe(nombre);
  await page.reload();
  await expect(page.getByTestId('servicio-kpi').first()).toContainText('$1,240.00');
  await expect(page.getByTestId('servicio-gasto')).toContainText('$1,240.00');
  await page.goto('/empresa/servicios?ver=uso');
  const fila = page.getByTestId('servicio').filter({ hasText: nombre });
  await expect(fila).toContainText('Por uso');
  await expect(fila).toContainText('$1,240.00');
  await expect(fila).toContainText('Activo');
  await page.goto('/empresa/movimientos?ver=recurrentes');
  await expect(page.getByTestId('recurrente').filter({ hasText: nombre })).toContainText(
    'Sin monto fijo',
  );

  // «Editar» carries the alert; «Dar de baja» takes it off the list and keeps its expense.
  await page.goto('/empresa/servicios');
  await page.getByRole('link', { name: nombre, exact: true }).click();
  await page.getByRole('link', { name: 'Editar', exact: true }).click();
  const cajon = page.getByRole('dialog', { name: `Editar ${nombre}` });
  await cajon.getByLabel('Avisar si el mes pasa de (opcional)').fill('3000');
  await cajon.getByRole('button', { name: 'Guardar servicio' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('servicio-kpi').nth(2)).toContainText('$3,000.00');
  await page.getByRole('button', { name: `Dar de baja ${nombre}` }).click();
  await expect(page.getByText('De baja', { exact: true })).toBeVisible();
  await expect(page.getByTestId('servicio-gasto')).toContainText('$1,240.00');
  await page.goto('/empresa/servicios');
  await expect(page.getByTestId('servicio').filter({ hasText: nombre })).toHaveCount(0);
});

test('on a phone the rail folds into «Menú» and no Empresa page scrolls sideways', async ({
  page,
}) => {
  await signInAsStaff(page, SOCIO);
  await page.setViewportSize(TELEFONO);

  // Real rows: E-12's March, the busiest month the suite leaves.
  await page.goto(`/empresa?periodo=${MES}`);
  await expect(kpi(page, 'Ingresos netos')).toContainText('$10,000');
  await sinScrollLateral(page);
  await page.goto(`/empresa/resultados?periodo=${MES}`);
  await expect(renglon(page, 'utilidad_neta')).toContainText('$4,900.00');
  await sinScrollLateral(page);

  // The menu is the rail: the same links, the entry lit, closed by a tap.
  await abrirMenu(page);
  const enMenu = (nombre: string) => menu(page).getByRole('link', { name: nombre, exact: true });
  await expect(enMenu('Resultados')).toHaveAttribute('aria-current', 'page');
  await enMenu('Resumen').click();
  await expect(page).toHaveURL(/\/empresa$/);
  await expect(menu(page)).toBeHidden();
  await abrirMenu(page);
  await expect(enMenu('Resumen')).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Escape');
  await expect(menu(page)).toBeHidden();
});

test('a founder asks the SAT again, and cancels the invoice it says was cancelled', async ({
  page,
}) => {
  await fijarRfcMexia();
  await signInAsStaff(page, SOCIO);
  await abrirEntrada(page, 'Dinero');
  await abrirPestana(page, 'Facturas', /\/empresa\/facturas$/, 'Dinero');
  const uuids = await registrarParaConsultar(page);
  await fijarEstadoSat(uuids.hosting, 'sin_verificar');
  await fijarEstadoSat(uuids.disenador, 'cancelado');
  await page.reload();

  // No answer again: it stays unverified and says why, in place (board CD-06g).
  await expect(fila(page, MENSAJERIA.nombre)).toContainText('Sin verificar');
  await page
    .getByRole('button', { name: `Consultar al SAT la factura de ${MENSAJERIA.nombre}` })
    .click();
  await expect(fila(page, MENSAJERIA.nombre).getByRole('alert')).toHaveText(
    'El SAT no respondió. Intenta en unos minutos.',
  );

  // It answers «vigente»: the row says so, today.
  await page
    .getByRole('button', { name: `Consultar al SAT la factura de ${HOSTING.nombre}` })
    .click();
  await expect(page).toHaveURL(/consultada=/);
  await expect(fila(page, HOSTING.nombre)).toContainText('VigenteEl SAT la confirmó hoy');
  await expect(fila(page, MENSAJERIA.nombre)).not.toContainText('El SAT la confirmó hoy');

  // The supplier cancelled one still owed: a warning, and nothing reversed until a founder confirms.
  await expect(fila(page, DISENADOR.nombre)).toContainText('Cancelada en el SAT');
  await expect(
    page.getByRole('button', { name: `Registrar pago a ${DISENADOR.nombre}` }),
  ).toBeHidden();
  const aviso = page.getByRole('alert').filter({ hasText: 'El proveedor canceló esta factura' });
  await expect(aviso).toContainText('Su gasto de $1,000.00 y su IVA de $160.00 siguen registrados');
  await aviso.getByRole('button', { name: `Cancelar la factura de ${DISENADOR.nombre}` }).click();
  const cancelar = page.getByRole('form', { name: `¿Cancelar la factura de ${DISENADOR.nombre}?` });
  await cancelar.getByRole('button', { name: 'Sí, cancelar la factura' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Factura cancelada' })).toBeVisible();
  await expect(fila(page, DISENADOR.nombre)).toContainText('Cancelada');
  await expect(fila(page, DISENADOR.nombre).getByRole('link', { name: 'Revertido' })).toBeVisible();
  await expect(page.getByText('El proveedor canceló esta factura')).toBeHidden();

  // A paid one is only warned about: its money did leave the bank (owner, 2026-10-31).
  await fijarEstadoSat(uuids.hosting, 'cancelado');
  await page.reload();
  const pagada = page.getByRole('alert').filter({ hasText: 'Ya la pagaste' });
  await expect(pagada).toContainText(
    'Pide al proveedor la factura que la sustituye o el reembolso',
  );
  await expect(pagada.getByRole('button')).toHaveCount(0);
});

test('a founder repeats a supplier who invoices every month, by its XML (CD-06h, CD-01f)', async ({
  page,
}) => {
  await fijarRfcMexia();
  await signInAsStaff(page, SOCIO);
  const meses = await registrarMensual(page);

  // The invoice's month is registered by it, with its date and its movement.
  await page.goto(`/empresa/movimientos?mes=${meses.anterior}&ver=recurrentes`);
  const pasado = recurrente(page, MENSUAL.nombre);
  await expect(pasado).toContainText(`RFC ${MENSUAL.rfc} · factura cada mes`);
  await expect(pasado).toContainText('Registrado');
  await expect(pasado).toContainText(/Con su factura del 1 \p{L}+/u);
  await expect(pasado.getByRole('link', { name: 'Ver' })).toBeVisible();

  // This month waits for the next invoice, and takes you to upload it.
  await page.goto(`/empresa/movimientos?mes=${meses.actual}&ver=recurrentes`);
  const actual = recurrente(page, MENSUAL.nombre);
  await expect(actual).toContainText('Falta su factura');
  await expect(actual).toContainText(`Pídela a ${MENSUAL.nombre}`);
  await actual.getByRole('link', { name: 'Subir su XML' }).click();
  await expect(page).toHaveURL(/\/empresa\/facturas$/);
});

test('a founder reads the issued invoices, each with its CFDI and its cobro (E-10, CD-06i)', async ({
  page,
}) => {
  await limpiarPagos();
  await sembrarPagos();
  try {
    // The daily import posts each payment once; a full refund reverses its cobro.
    expect((await importarCobros(page.request)).registrados).toBeGreaterThanOrEqual(4);
    expect((await importarCobros(page.request)).registrados).toBe(0);
    await reembolsarTaqueria();
    expect((await importarCobros(page.request)).revertidos).toBe(1);

    await signInAsStaff(page, SOCIO);
    await abrirEntrada(page, 'Dinero');
    await abrirPestana(page, 'Facturas', /\/empresa\/facturas$/, 'Dinero');
    await page
      .getByRole('navigation', { name: 'Facturas' })
      .getByRole('link', { name: 'Emitidas' })
      .click();
    await expect(page).toHaveURL(/\/empresa\/facturas\/emitidas\?mes=\d{4}-\d{2}$/);
    await expect(page.getByTestId('emitidas-cobrado')).toContainText('pagos de Stripe');

    // Real rows: who paid, the CFDI each got, and its cobro.
    const emitida = (nombre: string) =>
      page.getByTestId('factura-emitida').filter({ hasText: nombre });
    await expect(emitida(TAQUERIA)).toContainText(
      'CanceladaReembolso · nota de crédito por $499.00',
    );
    await expect(emitida(TAQUERIA).getByRole('link', { name: 'Revertido' })).toBeVisible();
    await expect(emitida(PAPELERIA)).toContainText(
      'RFC PAP010101AB1 · Plan Negocio · transferencia',
    );
    await expect(emitida(PAPELERIA)).toContainText(
      '$430.17$68.83$499.00TimbradaCon su complemento de pago',
    );
    await expect(
      emitida(ABARROTES).getByRole('link', { name: 'Emitir desde la bandeja' }),
    ).toHaveAttribute('href', `/inbox/${ITEM_MANUAL}`);
    const global = page.getByRole('region', { name: /Factura global de/ });
    await expect(global).toContainText('Por emitir');
    await expect(global.getByRole('link', { name: 'Ver en la bandeja' })).toHaveAttribute(
      'href',
      `/inbox/${ITEM_GLOBAL}`,
    );

    // The cobro is in Movimientos, named by its customer.
    await emitida(PAPELERIA).getByRole('link', { name: 'Cobro' }).click();
    await expect(page.getByText(`Cobro · ${PAPELERIA}`)).toBeVisible();
  } finally {
    await limpiarPagos();
  }
});

test('a founder closes a month, Registrar refuses it, and it reopens with both founders (E-14)', async ({
  page,
}) => {
  const mes = MES_CIERRE;
  const nombre = formatMonth(mes).split(' ')[0] ?? mes;
  const Nombre = `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)}`;
  const saldo = await sembrarMesCierre(mes);
  await agregarOtroSocio();
  try {
    await signInAsStaff(page, SOCIO);
    await page.goto('/empresa/agenda');
    await abrirPestana(page, 'Cierre del mes', /\/empresa\/cierre$/);
    await page.goto(`/empresa/cierre?mes=${mes}`);

    // Real data: the month's two movements reach the steps; before the SAT
    // registration there is no sale to invoice, nothing to import or declare.
    await expect(
      page.getByRole('heading', { name: `Faltan 2 pasos para cerrar ${nombre}` }),
    ).toBeVisible();
    for (const id of ['emitidas', 'ingresos', 'impuestos', 'agenda'])
      await esperarPaso(page, id, 'no_aplica');
    await esperarPaso(page, 'recibidas', 'hecho');
    await expect(page.locator('[data-paso="recibidas"]')).toContainText('1 marcado no deducible');
    await expect(page.locator('[data-paso="banco"]')).toContainText(formatMoney(saldo));
    await expect(page.getByRole('button', { name: `Cerrar ${nombre}` })).toBeDisabled();

    await confirmarSaldo(page, saldo);
    await subirEstados(page);
    await expect(
      page.getByRole('heading', { name: `${Nombre} está listo para cerrarse` }),
    ).toBeVisible();
    await page.getByRole('button', { name: `Cerrar ${nombre}` }).click();
    await expect(page.getByTestId('cierre-chip')).toHaveText('Cerrado');
    await expect(page.getByRole('heading', { name: `${Nombre} está cerrado` })).toBeVisible();

    // The ledger takes nothing dated in it, and Registrar says where to go.
    await registrarEnMesCerrado(page, mes, Nombre);

    // Asking to reopen: it stays closed, and the asker cannot approve.
    await page.getByRole('link', { name: `Pedir reabrir ${nombre}` }).click();
    const pedir = page.getByRole('dialog', { name: `Pedir reabrir ${nombre}` });
    await pedir.getByLabel('¿Qué hay que corregir?').fill('E2E falta la comisión');
    await pedir.getByRole('button', { name: `Pedir a ${OTRO_SOCIO}` }).click();
    await expect(page.getByTestId('cierre-pedido')).toContainText(`Pediste reabrir ${nombre}`);
    await expect(page.getByRole('link', { name: 'Revisar y aprobar' })).toHaveCount(0);
    await expect(page.getByTestId('cierre-chip')).toHaveText('Cerrado');

    // The other founder rejects it and asks themselves; this founder approves.
    await otroSocioRechazaYPide(mes, 'E2E faltaba otra comisión');
    await page.reload();
    await expect(page.getByTestId('cierre-pedido')).toContainText(
      `${OTRO_SOCIO} pidió reabrir ${nombre}`,
    );
    await page.getByRole('link', { name: 'Revisar y aprobar' }).click();
    await page
      .getByRole('dialog', { name: `Reabrir ${nombre}` })
      .getByRole('button', { name: 'Aprobar y reabrir' })
      .click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('cierre-chip')).toHaveText('Listo');
    const historia = page.getByTestId('cierre-historial').filter({ hasText: Nombre });
    await expect(historia).toContainText('reapertura rechazada');
    await expect(historia).toContainText(`pidió ${OTRO_SOCIO}, aprobó Socia E2E`);
  } finally {
    await quitarOtroSocio();
  }
});

test('a founder reads Caja: cash, spending, the scenarios and the next payments (E-23)', async ({
  page,
}) => {
  const hoy = hoyCaja();
  const dia = await sembrarCargoProximo(hoy);
  await signInAsStaff(page, SOCIO);
  await page.goto('/empresa/movimientos');
  await abrirPestana(page, 'Caja', /\/empresa\/caja$/, 'Dinero');

  // Real data: the ledger's cash and its three-month spending reach the tiles.
  const a = await esperadoDeCaja(hoy);
  await expect(page.getByTestId('caja-Caja')).toHaveText(formatMoney(a.caja));
  await expect(page.getByTestId('caja-Gasto al mes')).toHaveText(formatMoney(a.sale));
  await expect(page.getByRole('link', { name: /^Ver el cierre de / })).toBeVisible();

  // The chart: real months, then six projected; a scenario redraws it.
  await expect(page.locator('[data-testid="caja-barra"][data-real="no"]')).toHaveCount(6);
  await expect(page.locator('[data-testid="caja-barra"][data-real="si"]').first()).toBeVisible();
  await page.getByRole('link', { name: 'Si se detuvieran hoy' }).click();
  await expect(page).toHaveURL(/\/empresa\/caja\?escenario=detener$/);
  await expect(page.getByTestId('caja-titular')).toHaveText(/^Sin (ingresos|gastos)/);
  await expect(page.getByRole('link', { name: 'Si se detuvieran hoy' })).toHaveAttribute(
    'aria-current',
    'true',
  );

  // The next 30 days carry the charge due in three days, at its usual amount.
  const pago = page.getByTestId('caja-pago').filter({ hasText: E2E_HOSTING });
  await expect(pago).toContainText('$1,234.50');
  await expect(pago).toContainText(`${Number(dia.slice(8, 10))} `);
  await expect(page.getByTestId('caja-flujo')).toContainText('Cambio en la operación');
  await expect(page.getByTestId('caja-socios')).toContainText('Dinero de los socios');
});

test('a founder prepares a quarter’s budget, approves the other’s, and spends outside it (E-22)', async ({
  page,
}) => {
  const hoy = hoyPresupuesto();
  const t = trimestreMx();
  const T = `${t.slice(6)}T ${t.slice(0, 4)}`;
  await agregarOtroSocio();
  try {
    await signInAsStaff(page, SOCIO);
    await page.goto('/empresa/resultados');
    await abrirPestana(page, 'Presupuesto', /\/empresa\/presupuesto$/, 'Resultados');
    await expect(
      page.getByRole('heading', { name: `El ${T} aún no tiene presupuesto` }),
    ).toBeVisible();

    // This founder prepares it: it waits on the other one, who cannot be this one.
    await page.getByRole('link', { name: `Preparar el presupuesto del ${T}` }).click();
    const preparar = page.getByRole('dialog', { name: `Preparar el presupuesto del ${T}` });
    for (const [campo, monto] of [
      ['Costo del servicio al mes', '1000'],
      ['Ventas y marketing al mes', '2000'],
      ['Desarrollo al mes', '500'],
      ['Administración al mes', '500'],
    ] as const) {
      await preparar.getByLabel(campo).fill(monto);
    }
    await expect(preparar.getByTestId('preparar-total')).toHaveText('Total al mes $4,000.00');
    await preparar.getByRole('button', { name: `Enviar a ${OTRO_SOCIO}` }).click();
    await expect(page.getByTestId('presupuesto-aviso')).toContainText(
      `Enviaste el presupuesto del ${T} a ${OTRO_SOCIO}: $4,000.00 al mes`,
    );
    await expect(page.getByRole('link', { name: 'Revisar y aprobar' })).toHaveCount(0);

    // The other founder rejects it and sends their own; this founder approves that one.
    await otroSocioRechazaYPrepara(t);
    await page.reload();
    await expect(page.getByTestId('presupuesto-aviso')).toContainText(
      `${OTRO_SOCIO} preparó el presupuesto del ${T}: $7,000.00 al mes`,
    );
    await page.getByRole('link', { name: 'Revisar y aprobar' }).click();
    const aprobar = page.getByRole('dialog', { name: `Aprobar el presupuesto del ${T}` });
    await expect(aprobar.getByTestId('aprobar-tabla')).toContainText('$7,000.00');
    await aprobar.getByRole('button', { name: `Aprobar el presupuesto del ${T}` }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('presupuesto-aprobado')).toContainText(
      `aprobado por ${OTRO_SOCIO} y Socia E2E`,
    );

    // Real data: the month's spending and the Límite as the ledger has them.
    const e = await esperadoDePresupuesto(hoy);
    const tiles = page.getByTestId('presupuesto-tile');
    await expect(tiles.nth(0)).toContainText('$7,000.00');
    await expect(tiles.nth(1)).toContainText(formatMoney(e.gastado));
    await expect(page.getByTestId('presupuesto-linea')).toHaveCount(4);
    await expect(page.getByTestId('presupuesto-limite')).toHaveText(
      `${formatMoney(e.limite)} al mes por socio`,
    );

    // Inside the Límite it is approved on its own.
    await page.getByRole('link', { name: 'Pedir un gasto fuera del presupuesto' }).click();
    const pedir = page.getByRole('dialog', { name: 'Pedir un gasto fuera del presupuesto' });
    await pedir.getByLabel('Para qué es').fill('E2E Canva');
    await pedir.getByLabel('Monto, con IVA').fill('100');
    await pedir.getByText('Ventas y marketing', { exact: true }).click();
    await expect(pedir.getByTestId('pedir-aviso')).toContainText(
      'Cabe en tu Límite: se aprueba solo',
    );
    await pedir.getByRole('button', { name: 'Registrar la solicitud' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const canva = page.getByTestId('presupuesto-fuera').filter({ hasText: 'E2E Canva' });
    await expect(canva).toContainText('Sin aprobación');

    // The other founder's request above theirs: this founder approves part of it.
    await otroSocioPide(hoy);
    await page.reload();
    const card = page.getByTestId('presupuesto-por-aprobar').filter({ hasText: E2E_CAMPANA });
    await expect(card).toContainText('$6,000.00');
    await card.getByRole('link', { name: 'Aprobar con otro monto' }).click();
    const otro = page.getByRole('dialog', { name: 'Aprobar con otro monto' });
    await otro.getByLabel('Monto que apruebas').fill('3000');
    await otro.getByRole('button', { name: 'Aprobar $3,000.00' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const campana = page.getByTestId('presupuesto-fuera').filter({ hasText: E2E_CAMPANA });
    await expect(campana).toContainText('Aprobado');
    await expect(campana).toContainText('pidió $6,000.00');
    await expect(campana).toContainText('$3,000.00');

    // The whole quarter.
    await page.getByRole('link', { name: `${T} completo` }).click();
    await expect(page).toHaveURL(/\/empresa\/presupuesto\?vista=trimestre$/);
    await expect(tiles.nth(0)).toContainText('$21,000.00');
  } finally {
    await quitarOtroSocio();
  }
});

test('a founder downloads the contador’s package, and types in and validates the codes (E-43)', async ({
  page,
}) => {
  const mes = MES_CONTADOR;
  const nombre = formatMonth(mes).split(' ')[0] ?? mes;
  const saldo = await sembrarMesCierre(mes);
  await signInAsStaff(page, SOCIO);
  await page.goto(`/empresa/cierre?mes=${mes}`);
  await page.getByRole('link', { name: 'Paquete para el contador' }).click();
  const panel = page.getByRole('dialog', { name: 'Paquete para el contador' });

  // Real data: the month's ledger reaches the balanza, which has no code yet.
  await expect(panel.getByTestId('paquete-chip')).toHaveText('Preliminar');
  await expect(panel.getByTestId('paquete-aviso')).toContainText(
    '22 cuentas no tienen código agrupador',
  );
  const bancos = panel.locator('[data-cuenta="bancos"]');
  await expect(bancos).toContainText('Sin código');
  await expect(bancos).toContainText(formatMoney(saldo));
  await expect(panel.getByTestId('paquete-cuadra')).toHaveText('22 cuentas · cuadra');
  await expect(panel.getByTestId('paquete-parte').nth(2)).toContainText(
    'el gasto sin factura, marcado no deducible, va solo en la balanza',
  );
  await expect(panel.getByTestId('paquete-descargar')).toHaveText(
    `Descargar el preliminar de ${nombre}`,
  );

  // The codes: the list for the contador, typed in with one missing, then all.
  await panel.getByRole('link', { name: 'Ver los códigos' }).click();
  await expect(page).toHaveURL(/\/empresa\/cierre\/codigos$/);
  await expect(page.getByRole('heading', { name: 'Aún no hay códigos agrupadores' })).toBeVisible();
  const lista = await page.request.get('/empresa/cierre/codigos/lista');
  expect(await lista.text()).toContain('Bancos,Activo,Deudora,');
  await capturarCodigos(page, 'afac');
  await expect(page.getByRole('heading', { name: '21 de 22 cuentas con su código' })).toBeVisible();
  await expect(page.locator('[data-cuenta="afac"]')).toContainText('Falta');
  await expect(page.getByRole('button', { name: 'Marcar como validada' })).toBeDisabled();
  await capturarCodigos(page, null);
  await expect(
    page.getByRole('heading', { name: 'Las 22 cuentas tienen su código' }),
  ).toBeVisible();
  await page
    .getByTestId('codigos-validar')
    .getByRole('button', { name: 'Marcar como validada' })
    .click();
  await expect(page.getByTestId('codigos-chip')).toHaveText('Validados');
  await expect(page.getByRole('heading', { name: /^Validados por el contador el / })).toBeVisible();

  // The package now goes without a warning, and the .zip carries the codes.
  await page.goto(`/empresa/cierre?mes=${mes}&panel=contador`);
  await expect(panel.getByTestId('paquete-aviso')).toHaveCount(0);
  await expect(bancos).toContainText(codigoDe('bancos'));
  const href = (await panel.getByTestId('paquete-descargar').getAttribute('href')) ?? '';
  const zip = await bajarPaquete(page.request, href);
  expect(zip.tipo).toBe('application/zip');
  expect(Object.keys(zip.archivos)).toEqual(
    expect.arrayContaining([`balanza-${mes}.csv`, 'emitidas.csv']),
  );
  const linea = (zip.archivos[`balanza-${mes}.csv`] ?? '')
    .split('\r\n')
    .find((l) => l.startsWith(`${codigoDe('bancos')},Bancos,Deudora,`));
  expect(linea?.endsWith(`,${toPesosString(saldo)}`)).toBe(true);

  // Changing one code leaves the list unvalidated again.
  await page.goto('/empresa/cierre/codigos');
  await page.getByLabel('Código agrupador de Bancos').fill('102.02');
  await page.getByRole('button', { name: 'Guardar los códigos' }).click();
  await expect(page.getByTestId('codigos-chip')).toHaveText('Sin validar · 22 de 22');
});

test('a founder plans the next quarter, takes a card through the mediator, and sends a notice (E-20)', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await agregarOtroSocio();
  await sembrarCierre();
  try {
    await signInAsStaff(page, SOCIO);
    await page.goto('/empresa/socios');
    await abrirPestana(page, 'Tablero', /\/empresa\/tablero$/, 'Socios');
    const banner = page.getByTestId('tablero-banner').first();

    // The next quarter's plan: a card with this founder's value, the other's, sent and approved.
    const SIG = nombreT(TABLERO_SIGUIENTE);
    await page.getByRole('link', { name: 'Trimestre siguiente' }).click();
    await expect(banner).toContainText(`El plan del ${SIG} se arma aquí`);
    await page.getByRole('link', { name: '+ Nueva tarjeta' }).click();
    const nueva = page.getByRole('dialog', { name: 'Nueva tarjeta' });
    await nueva.getByLabel('Título', { exact: true }).fill('E2E Integración con el SAT');
    await nueva.getByLabel('Criterio de terminado').fill('Las facturas recibidas llegan solas.');
    await nueva.getByLabel('Tu propuesta de valor').fill('40000');
    await nueva.getByLabel('Fecha', { exact: true }).fill(primerDia(TABLERO_SIGUIENTE));
    await nueva.getByRole('button', { name: 'Agregar la tarjeta' }).click();
    const fila = page.getByTestId('plan-fila').filter({ hasText: 'E2E Integración con el SAT' });
    await expect(fila).toContainText('$40,000');
    await expect(fila).toContainText('Falta su valor');
    await otroPoneValor('E2E Integración con el SAT', 30000);
    await page.reload();
    await expect(fila).toContainText('$35,000');
    await page.getByRole('button', { name: 'Enviar el plan' }).click();
    await expect(banner).toContainText(`Enviaste el plan del ${SIG}`);
    await otroApruebaPlan(TABLERO_SIGUIENTE);
    await page.reload();
    await expect(banner).toContainText(`El plan del ${SIG} lo aprobó Fundador 2`);
    await expect(page.getByTestId('tablero-comprometido-1')).toHaveText('$35,000');

    // This quarter: a card started, finished with a link, objected, and accepted by the mediator.
    await page.goto(`/empresa/tablero?t=${TABLERO_ACTUAL}`);
    await page.getByRole('link', { name: '+ Nueva tarjeta' }).click();
    await nueva.getByLabel('Título', { exact: true }).fill('E2E Guía de inicio');
    await nueva.getByLabel('Criterio de terminado').fill('Cinco videos en la ayuda.');
    await nueva.getByLabel('Tu propuesta de valor').fill('20000');
    await nueva.getByLabel('Fecha', { exact: true }).fill(hoyTablero());
    await nueva.getByRole('button', { name: 'Agregar la tarjeta' }).click();
    const guia = (columna: string) =>
      page
        .getByTestId(`columna-${columna}`)
        .getByTestId('tablero-tarjeta')
        .filter({ hasText: 'E2E Guía de inicio' });
    // The card is saved and the drawer closed before the other founder values it.
    await expect(nueva).toHaveCount(0);
    await expect(guia('por_hacer')).toContainText('Falta un valor');
    await otroPoneValor('E2E Guía de inicio', 20000);
    await page.reload();
    await expect(guia('por_hacer')).toContainText('Valor: $20,000, los dos igual');
    await guia('por_hacer').click();
    const cajon = page.getByRole('dialog', { name: 'E2E Guía de inicio' });
    await expect(cajon.getByTestId('tarjeta-valores')).toContainText('se usa el promedio: $20,000');
    await cajon.getByRole('button', { name: 'Empezar' }).click();
    await expect(guia('en_curso')).toBeVisible();
    await cajon.getByLabel('O un enlace').fill('https://xangarro.mx/ayuda');
    await cajon.getByRole('button', { name: 'Marcar terminado' }).click();
    await expect(guia('en_revision')).toContainText('puede objetar hasta el');
    await otroObjeta('E2E Guía de inicio', 'Falta el video de inventario.');
    await page.reload();
    await expect(guia('en_revision')).toContainText('Objetada: Falta el video de inventario.');
    await cajon
      .getByLabel('¿Por qué la llevas al mediador?')
      .fill('Está en la sección de egresos.');
    await cajon.getByRole('button', { name: 'Llevar al mediador' }).click();
    await expect(guia('en_revision')).toContainText('Con el mediador');
    await cajon.getByLabel('El documento del mediador').setInputFiles({
      name: 'resolucion.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 resolución'),
    });
    await cajon.getByRole('button', { name: 'Registrar la resolución' }).click();
    await expect(guia('terminado')).toContainText('Aceptado por el mediador');
    await expect(cajon.getByTestId('tarjeta-historia')).toContainText(
      'Objetó: «Falta el video de inventario.»',
    );
    await expect(page.getByTestId('tablero-aceptado-1')).toHaveText('$20,000');

    // E-12's memo reads it: the card was finished this month, and Resultados opens on this month.
    await page.goto('/empresa/resultados');
    await expect(page.getByTestId('costo-sudor')).toContainText('Costo de sudor: $20,000');

    // An objective, typed in and updated by hand.
    await page.goto(`/empresa/tablero?t=${TABLERO_ACTUAL}&panel=nuevo-objetivo`);
    const objetivo = page.getByRole('dialog', { name: 'Nuevo objetivo' });
    await objetivo.getByLabel('Objetivo', { exact: true }).fill('E2E 60 negocios pagando');
    await objetivo.getByLabel('Meta').fill('60');
    await objetivo.getByLabel('Unidad').fill('negocios');
    await objetivo.getByRole('button', { name: 'Agregar el objetivo' }).click();
    const fila60 = page
      .getByTestId('tablero-objetivo')
      .filter({ hasText: 'E2E 60 negocios pagando' });
    await fila60.getByRole('link', { name: 'Actualizar avance' }).click();
    await page
      .getByRole('dialog', { name: 'E2E 60 negocios pagando' })
      .getByLabel('Avance')
      .fill('48');
    await page.getByRole('button', { name: 'Guardar el avance' }).click();
    await expect(fila60).toContainText('48 de 60 negocios');

    // A closed quarter with Fundador 2 under the minimum: the clause, the draft, its PDF, sent.
    const CER = nombreT(TABLERO_CERRADO);
    await page.goto(`/empresa/tablero?t=${TABLERO_CERRADO}`);
    await expect(banner).toContainText(
      `Cierre del ${CER}: Fundador 2 · ${OTRO_SOCIO} no llegó al mínimo`,
    );
    await expect(page.getByTestId('tablero-socio-1')).toContainText('Cumplió · 100 %');
    await expect(page.getByTestId('tablero-socio-2')).toContainText('No cumplió · 0 %');
    await page.getByRole('link', { name: 'Preparar el aviso' }).click();
    const aviso = page.getByRole('dialog', { name: 'Aviso de incumplimiento' });
    await aviso.getByLabel('Número de la cláusula').fill('Décima segunda');
    await aviso
      .getByLabel('Su texto')
      .fill('E2E El socio que no cumpla pierde su parte del corte.');
    await aviso.getByRole('button', { name: 'Guardar la cláusula' }).click();
    const borrador = aviso.getByTestId('aviso-borrador');
    await expect(borrador).toContainText('te comprometiste a entregables por $30,000.00');
    await expect(borrador).toContainText('E2E Alianza cerrada, $30,000.00: no se empezó.');
    await expect(borrador).toContainText('«E2E El socio que no cumpla pierde su parte del corte.»');
    const pdf = await page.request.get(`/empresa/tablero/aviso?t=${TABLERO_CERRADO}`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()['content-type']).toBe('application/pdf');
    await aviso.getByRole('button', { name: 'Marcar como enviado' }).click();
    await expect(aviso.getByTestId('aviso-enviado')).toContainText('Enviado el');
  } finally {
    await quitarOtroSocio();
  }
});

test('a founder registers a USD invoice at what the bank charged (E-42)', async ({ page }) => {
  await fijarRfcMexia();
  await signInAsStaff(page, SOCIO);
  await abrirEntrada(page, 'Dinero');
  await page.getByRole('link', { name: '+ Registrar' }).click();
  await expect(page.getByRole('heading', { name: 'Registrar', level: 1 })).toBeVisible();

  // A paid invoice in USD: its own rate is the supplier's; the books take the bank's charge.
  await adjuntar(page, 'nube-usd.xml', {
    emisor: { rfc: 'NUB100101AB3', nombre: 'Nube E2E' },
    concepto: 'Servidores E2E en USD',
    subtotal: '100.00',
    iva: '0.00',
    isr: '0.00',
    ivaRetenido: '0.00',
    tipoCambio: '18.1000',
  });
  const delXml = page.getByRole('region', { name: 'Del XML' });
  await expect(delXml).toContainText('Al tipo de cambio de la factura$1,810.00');
  const cargo = page.getByLabel('Lo que cobró el banco (MXN)');
  await expect(page.getByText('La factura es de USD 100.00 y dice 18.1000')).toBeVisible();
  await cargo.fill('1861.40');
  await expect(page.getByTestId('tc-del-banco')).toContainText('18.6140 pesos por dólar');
  await page.getByLabel('Fecha de pago').fill(hoyMx());
  await page.getByText('Costo del servicio', { exact: true }).click();
  await page.getByRole('button', { name: 'Registrar gasto' }).click();

  await expect(page).toHaveURL(/\/empresa\/movimientos\?mes=\d{4}-\d{2}$/);
  const row = page.getByTestId('movimiento').filter({ hasText: 'Servidores E2E en USD' });
  await expect(row).toContainText('−$1,861.40');
  await expect(row).toContainText('USD 100.00 · el banco cobró a 18.6140');
});

test('a founder reads a quarter in figures: this one in progress, a closed one (E-17)', async ({
  page,
}) => {
  // Reads what the E-20 test left: this quarter's accepted card and objective, and its
  // seeded closed quarter, where Fundador 2 fell short.
  await signInAsStaff(page, SOCIO);
  await page.goto('/empresa/socios');
  await abrirPestana(page, 'Trimestre', /\/empresa\/trimestre$/, 'Socios');
  const cifras = page.getByTestId('trimestre-cifras');
  await expect(cifras).toContainText('En curso');
  const tablero = page
    .getByTestId('trimestre-tile')
    .filter({ hasText: 'Valor aceptado en el Tablero' });
  await expect(tablero).toContainText('$20,000');
  await expect(
    page.getByTestId('trimestre-acumulado').filter({ hasText: 'Valor aceptado en el Tablero' }),
  ).toContainText('$20,000');
  await expect(page.getByTestId('trimestre-barra')).toHaveCount(4);
  await expect(page.getByTestId('trimestre-objetivo')).toContainText('48 de 60 negocios');
  await expect(page.getByTestId('trimestre-socio-1')).toContainText('Aceptado $20,000');
  await expect(page.getByRole('button', { name: 'Exportar PDF' })).toBeVisible();

  await page.goto(`/empresa/trimestre?t=${TABLERO_CERRADO}`);
  await expect(cifras).toContainText('Cerrado');
  await expect(page.getByTestId('trimestre-socio-1')).toContainText('Cumplió · 100 %');
  await expect(page.getByTestId('trimestre-socio-2')).toContainText('No cumplió · 0 %');
  await expect(page.getByTestId('trimestre-cumplimiento')).toContainText(
    'obligaciones a tiempo, con evidencia',
  );
});
