import { expect, type Page } from '@playwright/test';

import type { ConsolaTenant } from './consola-fixture';
import { cifra, ESTADO, HITS, type Migraciones } from './consola-rows';

/**
 * J9-06 and J9-08 · Migraciones, Uso, Capacidad, Campañas and Mapa, each held
 * to a figure the spec put there or reads from the same tables the page does.
 */
const n = (v: number): string => v.toLocaleString('es-MX');
const fila = (page: Page, text: string) => page.getByRole('row').filter({ hasText: text });

export async function verMigraciones(page: Page, t: ConsolaTenant, m: Migraciones) {
  await page.goto('/migraciones');
  await expect(page.getByRole('heading', { name: 'Migraciones asistidas' })).toBeVisible();
  await expect(fila(page, m.enRevision.slice(-6))).toContainText(
    `${t.biz.slice(-8)}En revisiónEleventa`,
  );
  await expect(fila(page, m.enviada.slice(-6))).toContainText('Esperando al negocio');

  await page.getByRole('link', { name: new RegExp(m.enRevision.slice(-6)) }).click();
  await expect(page).toHaveURL(new RegExp(`/migraciones/${m.enRevision}$`));
  await expect(page.getByText(`«${m.notas}»`)).toBeVisible();
  const archivo = page.getByRole('link', { name: m.archivo });
  await expect(page.getByRole('listitem').filter({ has: archivo })).toContainText(
    `(${Math.ceil(m.bytes.length / 1024)} KB)`,
  );
  const descarga = await page.request.get((await archivo.getAttribute('href')) ?? '');
  expect(descarga.status()).toBe(200);
  expect(Buffer.from(await descarga.body()).equals(m.bytes)).toBe(true);
  await expect(page.getByRole('button', { name: 'Enviar al negocio' })).toBeVisible();

  // Already sent: its template and mapped file show, and nothing is left to send.
  await page.goto(`/migraciones/${m.enviada}`);
  await expect(page.getByText('Plantilla: clientes')).toBeVisible();
  await expect(page.getByRole('link', { name: m.mapeado })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar al negocio' })).toHaveCount(0);
}

/** The month /uso measures: `YYYY-MM`, Mexico City time. */
const MES_CDMX = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
});

export async function verUso(page: Page, t: ConsolaTenant) {
  await page.goto('/uso');
  await expect(page.getByRole('heading', { name: 'Uso', level: 1 })).toBeVisible();
  const mia = fila(page, t.nombre);
  await expect(mia.getByRole('cell').nth(1)).toContainText('Xangarrote');
  // «3», then Xangarrote's limit under it: «0 % de 30,000».
  await expect(mia.getByRole('cell').nth(2)).toHaveText('30 % de 30,000');
  await expect(mia.getByRole('cell').nth(4)).toHaveText('2transacciones');

  const mes = MES_CDMX.format(new Date());
  const total = await cifra(
    `SELECT coalesce(sum(transactions), 0) AS n FROM admin_tenant_usage('${mes}', NULL, NULL, 100)
      WHERE period = '${mes}'`,
  );
  expect(total).toBeGreaterThanOrEqual(3);
  const kpi = page.getByRole('region', { name: `Transacciones · ${mes}` });
  await expect(kpi).toHaveText(new RegExp(`^Transacciones · ${mes}${n(total)}entre `));
}

export async function verCapacidad(page: Page) {
  const activos = await cifra(`
    SELECT count(DISTINCT business_id) AS n FROM devices
     WHERE revoked_at IS NULL AND last_push_at > now() - interval '30 days'`);
  // The minted business's caja pushed an hour ago; the seed's last pushed in May.
  expect(activos).toBeGreaterThanOrEqual(1);
  await page.goto('/capacidad');
  await expect(page.getByRole('heading', { name: 'Capacidad', level: 1 })).toBeVisible();
  const tile = page
    .locator('div')
    .filter({ has: page.getByText(/^Negocios activos \(30 días\)/) })
    .last();
  await expect(tile).toContainText(new RegExp(`^Negocios activos \\(30 días\\) · S\\d${activos}`));
  await expect(page.getByText(/^La base pesa [\d.,]+ (MB|GB) de [\d.,]+ (MB|GB)\./)).toBeVisible();
}

const VENTANA_GEO = `day >= (now() AT TIME ZONE 'America/Mexico_City')::date - 30
  AND day <= (now() AT TIME ZONE 'America/Mexico_City')::date`;

const hits = (where: string) =>
  cifra(`SELECT coalesce(sum(hits), 0) AS n FROM xangarro.geo_counters
          WHERE country = 'MX' AND ${VENTANA_GEO} AND ${where}`);

export async function verMapa(page: Page) {
  const zac = (source: string) => hits(`region = '${ESTADO.code}' AND source = '${source}'`);
  const [login, landing, compra] = [await zac('login'), await zac('landing'), await zac('compra')];
  expect([login, landing, compra]).toEqual([HITS.login, HITS.landing, HITS.compra]);
  const nacional = await hits('true');

  await page.goto('/mapa?metrica=todos&rango=30d');
  await expect(page.getByRole('heading', { name: 'Mapa', level: 1 })).toBeVisible();
  await expect(page.getByText(`Total nacional: ${n(nacional)}.`)).toBeVisible();
  const estado = fila(page, `${ESTADO.nombre} ${ESTADO.code}`);
  const celdas = [login + landing + compra, login, landing, compra].map(n);
  const conversion = `${((compra / landing) * 100).toFixed(1)} %`;
  await expect(estado.getByRole('cell')).toHaveText([...celdas, conversion]);
}

export async function verCampanas(page: Page, campaign: string) {
  const altas = await cifra(`
    SELECT count(*) AS n FROM xangarro.signup_attribution
     WHERE created_at >= (now() AT TIME ZONE 'America/Mexico_City')::date - 30`);
  const visitas = await hits(`source = 'landing'`);
  const checkouts = await hits(`source = 'compra'`);

  await page.goto('/campanas');
  await expect(page.getByRole('heading', { name: 'Campañas', level: 1 })).toBeVisible();
  await expect(fila(page, campaign).getByRole('cell')).toHaveText([
    'facebook / cpc',
    '4',
    ESTADO.nombre,
  ]);
  await expect(page.getByText(new RegExp(`^${n(altas)} altas en el periodo;`))).toBeVisible();
  const embudo = page.getByRole('list', { name: 'Embudo del periodo' });
  await expect(embudo.getByRole('listitem')).toHaveText([
    new RegExp(`^Visitas al sitio${n(visitas)}`),
    new RegExp(`^Checkouts iniciados${n(checkouts)}`),
    new RegExp(`^Altas${n(altas)}`),
  ]);
}
