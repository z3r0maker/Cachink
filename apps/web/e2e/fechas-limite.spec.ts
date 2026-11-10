import { expect, test, type Page } from './test';

import { diaDelProyecto } from './dias-limite';
import { mintTenant, signIn, type Tenant } from './tenant';
import { addProduct, addSale } from './tenant-rows';

/**
 * J7-22 — the portal on the calendar's edges: Inicio, Estados and Movimientos
 * read on New Year's Day and on a leap day, each by a server whose business
 * clock is pinned there (`dias-limite.ts`, one project per day).
 *
 * Each day's tenant gets a sale on every day that decides a boundary — the
 * first day inside «Últimos 30 días» and the one before it, the Monday the
 * week starts on, the month's first and last — and each in a power of two, so
 * every total names exactly the rows it summed: a window one day too wide or
 * too short gives a different figure, never the same one by accident.
 */

interface Caso {
  /** Inicio's date line for the day. */
  readonly fecha: string;
  /** `fecha` → centavos: one sale per day. */
  readonly ventas: Readonly<Record<string, number>>;
  /** Inicio's «Últimos 30 días» sentence. */
  readonly ultimos30: string;
  /** Estados · Mensual: the period's label, and its ingresos. */
  readonly mes: { readonly etiqueta: string; readonly ingresos: string };
  /** Estados · Trimestral and Anual: their ingresos. */
  readonly trimestre: string;
  readonly anio: string;
  /** Estados · Personalizado over the previous calendar month. */
  readonly mesAnterior: {
    readonly desde: string;
    readonly hasta: string;
    readonly ingresos: string;
  };
  /** Movimientos: the month chip's label, and the three chips' «Ventas del periodo». */
  readonly chipMes: string;
  readonly movimientos: { readonly hoy: string; readonly semana: string; readonly mes: string };
}

const CASOS: Readonly<Record<string, Caso>> = {
  // Friday 1 January 2027. The 30 days are 3 Dec – 1 Jan; the week is
  // Monday 28 Dec – Sunday 3 Jan; the month, quarter and year are one day old.
  '2027-01-01': {
    fecha: 'viernes, 1 de enero de 2027',
    ventas: {
      '2026-11-30': 400,
      '2026-12-02': 800,
      '2026-12-03': 1600,
      '2026-12-28': 3200,
      '2026-12-31': 6400,
      '2027-01-01': 12800,
    },
    ultimos30: 'Últimos 30 días: ventas $240.00, gastos $0.00.',
    mes: { etiqueta: '01/ENE/2027 – 31/ENE/2027', ingresos: '$128.00' },
    trimestre: '$128.00',
    anio: '$128.00',
    mesAnterior: { desde: '2026-12-01', hasta: '2026-12-31', ingresos: '$120.00' },
    chipMes: 'Enero 2027',
    movimientos: { hoy: '$128.00', semana: '$224.00', mes: '$128.00' },
  },
  // Tuesday 29 February 2028. The 30 days are 31 Jan – 29 Feb; the week is
  // Monday 28 Feb – Sunday 5 Mar; the month ends today, on its 29th.
  '2028-02-29': {
    fecha: 'martes, 29 de febrero de 2028',
    ventas: {
      '2028-01-30': 400,
      '2028-01-31': 800,
      '2028-02-01': 1600,
      '2028-02-28': 3200,
      '2028-02-29': 6400,
    },
    ultimos30: 'Últimos 30 días: ventas $120.00, gastos $0.00.',
    mes: { etiqueta: '01/FEB/2028 – 29/FEB/2028', ingresos: '$112.00' },
    trimestre: '$124.00',
    anio: '$124.00',
    mesAnterior: { desde: '2028-01-01', hasta: '2028-01-31', ingresos: '$12.00' },
    chipMes: 'Febrero 2028',
    movimientos: { hoy: '$64.00', semana: '$96.00', mes: '$112.00' },
  },
};

const main = (page: Page) => page.locator('main');

/** The statement's «Ingresos» figure, as the screen prints it. */
const ingresos = (page: Page) =>
  main(page)
    .getByText('Ingresos', { exact: true })
    .first()
    .locator('xpath=ancestor::div[1]')
    .locator('span')
    .last();

/** Movimientos' «Ventas del periodo» tile. */
const ventasDelPeriodo = (page: Page) =>
  main(page).getByText('Ventas del periodo', { exact: true }).locator('..');

let t: Tenant;
let caso: Caso;

test.beforeAll(async ({}, testInfo) => {
  const { hoy } = diaDelProyecto(testInfo.project.name);
  const found = CASOS[hoy];
  if (found === undefined) throw new Error(`no case for ${hoy}`);
  caso = found;
  t = await mintTenant({ label: 'Calendario' });
  const productoId = await addProduct(t, { nombre: 'Orden de tacos' });
  for (const [i, [fecha, monto]] of Object.entries(caso.ventas).entries()) {
    await addSale(t, { fecha, monto, folio: i + 1, concepto: `Venta del ${fecha}`, productoId });
  }
});

test.beforeEach(async ({ page }) => {
  await signIn(page, t);
});

test('Inicio dates itself from the edge day and sums the 30 days that end on it', async ({
  page,
}) => {
  await page.goto('/');
  await expect(main(page).getByText(caso.fecha)).toBeVisible();
  await expect(main(page).getByText(caso.ultimos30)).toBeVisible();
  await expect(main(page).getByRole('img', { name: caso.ultimos30 })).toBeVisible();
});

test('Estados: the month, quarter and year that hold the day, and the month before', async ({
  page,
}) => {
  await page.goto('/estados');
  await expect(page.getByRole('status').filter({ hasText: '–' })).toHaveText(caso.mes.etiqueta);
  await expect(ingresos(page)).toHaveText(caso.mes.ingresos);

  await page.goto('/estados?p=trimestral');
  await expect(ingresos(page)).toHaveText(caso.trimestre);
  await page.goto('/estados?p=anual');
  await expect(ingresos(page)).toHaveText(caso.anio);

  const { desde, hasta } = caso.mesAnterior;
  await page.goto(`/estados?p=personalizado&desde=${desde}&hasta=${hasta}`);
  await expect(ingresos(page)).toHaveText(caso.mesAnterior.ingresos);
});

test('Movimientos: Hoy, Semana and the month chip are the edge day’s ranges', async ({ page }) => {
  await page.goto('/movimientos');
  await expect(page.getByRole('button', { name: caso.chipMes, exact: true })).toBeVisible();
  await expect(ventasDelPeriodo(page)).toContainText(caso.movimientos.mes);

  await page.goto('/movimientos?rango=hoy');
  await expect(ventasDelPeriodo(page)).toContainText(caso.movimientos.hoy);
  const hoy = Object.keys(caso.ventas).at(-1) ?? '';
  await expect(main(page).locator('tbody tr')).toHaveCount(1);
  await expect(main(page).locator('tbody tr')).toContainText(`Venta del ${hoy}`);

  await page.goto('/movimientos?rango=semana');
  await expect(ventasDelPeriodo(page)).toContainText(caso.movimientos.semana);
});
