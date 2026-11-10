import { expect, test, type Page } from '@playwright/test';

import { verCampanas, verCapacidad, verMapa, verMigraciones, verUso } from './consola-cifras';
import {
  clearConsolaStaff,
  clearConsolaTenant,
  CONSOLA,
  mintConsolaTenant,
  resetConsolaStaff,
  type ConsolaTenant,
} from './consola-fixture';
import { ponerEnListaBeta, verFlagCambiado, verLoQueVeElNegocio } from './consola-flags';
import {
  borrarAltas,
  sembrarAltas,
  sembrarMigraciones,
  sembrarTrafico,
  type Migraciones,
} from './consola-rows';
import { extenderPrueba, verDetalle, verFicha, verLista } from './consola-tenants';
import { signInAsStaff } from './helpers';

/**
 * Catalogue gap 11 (J9-05…J9-08): the console's pages that had no spec,
 * swept for real data. One business is minted with the rows each page is
 * held to — devices, a subscription, expenses, two assisted imports — plus a
 * campaign's signups and a state's traffic, none of which the seed has.
 *
 * Serial, one sign-in: every test is the same staff member, and a second
 * TOTP verify inside one 30-second step would wait the step out.
 */
test.describe.configure({ mode: 'serial' });

let page: Page;
let t: ConsolaTenant;
let migraciones: Migraciones;
let campaign = '';
let trafico = false;

test.beforeAll(async ({ browser }) => {
  await resetConsolaStaff();
  t = await mintConsolaTenant();
  migraciones = await sembrarMigraciones(t);
  campaign = await sembrarAltas(t);
  await sembrarTrafico(1);
  trafico = true;
  // Its own client address: the sign-in throttle is per IP (see empresa.spec).
  const context = await browser.newContext({
    extraHTTPHeaders: { 'x-forwarded-for': '203.0.113.31' },
  });
  page = await context.newPage();
  await signInAsStaff(page, CONSOLA);
});

test.afterAll(async () => {
  await page?.context().close();
  if (trafico) await sembrarTrafico(-1);
  if (campaign !== '') await borrarAltas(campaign);
  if (t !== undefined) await clearConsolaTenant(t);
  await clearConsolaStaff();
});

test('J9-05 · the tenant list shows plan, subscription, devices and sync health', async () => {
  await verLista(page, t);
});

test('J9-05 · the side panel and the full page show the tenant’s own rows', async () => {
  await verFicha(page, t);
  await verDetalle(page, t);
});

test('J9-05 · an extended trial lands in the page and in what the tenant reads', async () => {
  await page.goto(`/tenants/${t.biz}`);
  await extenderPrueba(page, t);
});

test('J9-05 · an unknown tenant is a 404, not an empty page', async () => {
  const response = await page.goto('/tenants/01HZ8XQN9GZJXV8AKQ5X0NOPE0');
  expect(response?.status()).toBe(404);
});

test('J9-06 · migraciones lists the requests and opens one with its files', async () => {
  await verMigraciones(page, t, migraciones);
});

test('J9-07 · a flag put on a beta list is stored and seen by that tenant alone', async () => {
  await ponerEnListaBeta(page, t);
  await verFlagCambiado(page, t);
  await verLoQueVeElNegocio(t);
});

test('J9-08 · uso counts the tenant’s transactions this month and last', async () => {
  await verUso(page, t);
});

test('J9-08 · capacidad measures the live database', async () => {
  await verCapacidad(page);
});

test('J9-08 · mapa shows the state’s traffic, every metric', async () => {
  await verMapa(page);
});

test('J9-08 · campañas credits the campaign and draws the funnel', async () => {
  await verCampanas(page, campaign);
});
