import { expect, test } from './test';

import { newUlid } from '@xangarro/domain';

import { respuesta, turno } from './phone-rows';
import { asTenant, pull, push, type Phone } from './sync-phone';
import { activateOn, freeSlots } from './tenant-phone';
import { mintTenant, signIn, type Tenant } from './tenant';
import { addOperator } from './tenant-rows';

/**
 * The aviso chain with the owner at both ends (docs/testing/e2e-test-catalog.md
 * J10-11, ADR-075): a phone closes a turno $20 short; the owner, in Cortes,
 * asks Ana about it («Preguntarle a Ana»); the phone's next pull carries the
 * message; Ana's reply goes up as a `respuestas_operador` row; and the owner
 * reads it in Avisos, where the panel promised it would be.
 *
 * The phone is simulated over HTTP (`sync-phone.ts`); its own Avisos screen
 * is the operador project's and Maestro's.
 */
test.describe.configure({ mode: 'serial' });
test.use({ storageState: { cookies: [], origins: [] } });

const DIA = '2026-05-12';
const RESPUESTA = 'Le di cambio de más a un cliente, ya lo platiqué con él.';

let t: Tenant;
let phone: Phone;
let ana = '';
const turnoId = newUlid();
let mensajeId = '';

test.beforeAll(async ({ request }) => {
  t = await mintTenant({ label: 'Aviso' });
  ana = await addOperator(t, { nombre: 'Ana Robledo' });
  await freeSlots(t);
  phone = await activateOn(request, t);
  const datos = { id: turnoId, userId: ana, fecha: DIA, aperturaAt: '2026-05-12T14:00:00.000Z' };
  const abre = turno(phone, { ...datos, fondo: 50000n });
  const cierra = turno(
    phone,
    { ...datos, fondo: 50000n },
    {
      at: '2026-05-12T20:00:00.000Z',
      esperado: 50000n,
      conteo: { 'billete-200': 2, 'billete-50': 1, 'billete-20': 1, 'moneda-10': 1 },
      motivo: 'error-en-cambio',
    },
  );
  const r = await (await push(request, phone, [abre, { ...cierra, clientSeq: 2 }])).json();
  expect(r.rejected, JSON.stringify(r.rejected)).toEqual([]);
});

test("the owner's question reaches the phone's next pull, and Ana's reply is stored", async ({
  page,
  request,
}) => {
  const cursor = (await pull(request, phone, phone.cursor)).serverSeq;

  await signIn(page, t);
  await page.goto('/cortes');
  const fila = page.getByRole('row', { name: /Ana Robledo/ }).first();
  await expect(fila).toContainText('−$20.00');
  await fila.click();
  await page
    .getByRole('dialog', { name: 'Ana Robledo' })
    .getByRole('button', { name: 'Preguntarle a Ana' })
    .click();
  await expect(page.getByText('Le preguntaste a Ana')).toBeVisible();

  // The question is a row the owner wrote, addressed to Ana, about this turno…
  await expect
    .poll(async () => {
      const [m] = await asTenant(
        t.biz,
        (sql) => sql<{ id: string }[]>`
          SELECT id FROM mensajes_operador WHERE caja_turno_id = ${turnoId} AND operador_id = ${ana}`,
      );
      return m?.id ?? '';
    })
    .not.toBe('');
  // …and an already-linked phone learns of it on its next pull, not only on a
  // fresh bootstrap (ADR-075: «with its sync_log append»).
  const got = await pull(request, phone, cursor);
  const mensaje = got.tables.mensajes_operador.find(
    (m: { cajaTurnoId: string | null }) => m.cajaTurnoId === turnoId,
  );
  expect(mensaje, 'the aclaración rides the next pull').toBeDefined();
  expect(mensaje.operadorId).toBe(ana);
  expect(mensaje.severidad).toBe('aclaracion');
  mensajeId = mensaje.id;

  // Ana answers from her Avisos: one UP row, accepted and stored.
  const reply = respuesta(phone, mensajeId, RESPUESTA, ana, '2026-05-12T21:00:00.000Z');
  const r = await (await push(request, phone, [reply])).json();
  expect(r.rejected, JSON.stringify(r.rejected)).toEqual([]);
  const [stored] = await asTenant(
    t.biz,
    (sql) => sql<{ texto: string }[]>`
      SELECT texto FROM respuestas_operador WHERE mensaje_id = ${mensajeId}`,
  );
  expect(stored?.texto).toBe(RESPUESTA);
});

// The portal never reads `respuestas_operador`: ADR-075 says the reply is
// «shown in the owner's cortes panel and Avisos», and the panel promises «Lo
// que conteste aparece en tus Avisos», but no screen renders it yet.
test.fixme("the owner reads Ana's reply in Avisos and on the corte's panel", async ({ page }) => {
  await signIn(page, t);
  await page.goto('/avisos');
  await expect(page.locator('main').getByText(RESPUESTA)).toBeVisible();
  await page.goto('/cortes');
  await page
    .getByRole('row', { name: /Ana Robledo/ })
    .first()
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Ana Robledo' }).getByText(RESPUESTA),
  ).toBeVisible();
});
