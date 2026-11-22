import assert from 'node:assert/strict';

import type { Browser } from 'playwright-core';
import { afterAll, beforeAll, describe, it } from 'vitest';

import {
  addRefresco,
  closeWalks,
  launch,
  newWalk,
  sellByCard,
  serverTickets,
  ticketPanel,
  undoWithNip,
  until,
} from './seeded-flows';

/**
 * S-12's acceptance: each seeded bug, applied as the web runner applies it,
 * changes the real app the way it says, checked by script with no model.
 * Opt-in, since it needs a whole corrida stack:
 * `pnpm --filter @xangarro/synth-core test:seeded` (`stack run` brings it up).
 * The phone's two bugs are the same rules through the API proxy, which
 * `seeded-proxy.test.ts` checks against a fake upstream.
 */
const RUN = process.env.SYNTH_SEEDED === '1';
let browser: Browser;

describe.skipIf(!RUN)('the seeded bugs on the real app', () => {
  beforeAll(async () => {
    browser = await launch();
  });
  afterAll(async () => {
    await browser?.close();
    await closeWalks();
  });
  const caja = (bug: string) =>
    newWalk(browser, { seed: 'negocio-con-catalogo-minimo', authAs: 'operador', bug });
  const sinPermiso = (bug: string) =>
    newWalk(browser, { seed: 'operador-sin-permiso', authAs: 'operador', bug });

  it('cobrar-primer-clic: the first click on «Cobrar» opens nothing, the second does', async () => {
    const { page } = await caja('cobrar-primer-clic');
    await addRefresco(page);
    const cobrar = ticketPanel(page).getByRole('button', { name: 'Cobrar', exact: true });
    const cobro = page.getByRole('region', { name: 'Cobro' });
    await cobrar.click();
    await page.waitForTimeout(1_000);
    assert.equal(await cobro.isVisible(), false);
    await cobrar.click();
    await cobro.waitFor();
  }, 120_000);

  it('etiqueta-tecnica: the button reads «Procesar transacción (POS)»', async () => {
    const { page } = await caja('etiqueta-tecnica');
    await addRefresco(page);
    const boton = ticketPanel(page).getByRole('button', { name: /^Procesar transacción \(POS\)/ });
    await boton.waitFor();
    assert.equal(
      await ticketPanel(page).getByRole('button', { name: 'Cobrar', exact: true }).count(),
      0,
    );
  }, 120_000);

  it('total-redondeo: a $25.00 refresco totals $24.99', async () => {
    const { page } = await caja('total-redondeo');
    await addRefresco(page);
    await ticketPanel(page).getByText('$24.99').first().waitFor();
  }, 120_000);

  it('guardar-500: the sale stays on the register, the server never gets it', async () => {
    const { page, access } = await caja('guardar-500');
    await sellByCard(page);
    const biz = access.tenant?.biz ?? '';
    const t = await until(
      () => serverTickets(biz),
      (r) => r.n > 0,
      15_000,
    );
    assert.equal(t.n, 0);
  }, 120_000);

  it('guardado-lento: the sale reaches the server, but only after 8 s', async () => {
    const { page, access } = await caja('guardado-lento');
    await sellByCard(page);
    const t0 = Date.now();
    const t = await until(
      () => serverTickets(access.tenant?.biz ?? ''),
      (r) => r.n > 0,
      40_000,
    );
    assert.equal(t.n, 1);
    assert.ok(Date.now() - t0 >= 7_500, `arrived after ${Date.now() - t0} ms`);
  }, 120_000);

  it('error-en-ingles: the refusal to cancel is in English', async () => {
    const { page, access } = await sinPermiso('error-en-ingles');
    await sellByCard(page);
    const dialogo = await undoWithNip(page, access.operators[0]?.nip ?? '');
    await dialogo.getByText('Permission denied (SIN_PERMISO)').waitFor();
  }, 120_000);

  it('fuga-permiso-cancelar: an operator who may not cancel, cancels', async () => {
    const { page, access } = await sinPermiso('fuga-permiso-cancelar');
    await sellByCard(page);
    await undoWithNip(page, access.operators[0]?.nip ?? '');
    const t = await until(
      () => serverTickets(access.tenant?.biz ?? ''),
      (r) => r.cancelled > 0,
      30_000,
    );
    assert.equal(t.cancelled, 1);
  }, 120_000);

  it('siguiente-fuera-de-vista: «Siguiente» is past the edge at 360 px, in view at 800', async () => {
    const siguiente = async (width: number) => {
      const { page } = await newWalk(browser, {
        seed: 'vacio',
        authAs: 'owner',
        bug: 'siguiente-fuera-de-vista',
        width,
      });
      await page.goto('/bienvenida');
      await page.getByRole('button', { name: '¡Va, empecemos!' }).click();
      const box = await page.getByRole('button', { name: 'Siguiente', exact: true }).boundingBox();
      return box?.x ?? -1;
    };
    assert.ok((await siguiente(360)) >= 360);
    assert.ok((await siguiente(800)) < 800);
  }, 180_000);
});
