import { compare } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { expect, test } from './test';
import { newUlid } from '@xangarro/domain';
import { API_PATHS, deviceHeaders } from '@xangarro/contracts';

import {
  activatePhone,
  asTenant,
  BIZ,
  pull,
  push,
  sale,
  TACO,
  ticket,
  type Phone,
} from './sync-phone';

/**
 * The chains the web caja already proves, with the PHONE as the origin
 * (docs/testing/e2e-test-catalog.md J10-08, J10-10, J10-13, J10-14): a phone
 * pushes a cancellation and a closed turno exactly as `CancelarTicketUseCase`
 * and the cierre write them, and the owner reads both on the portal; the
 * owner resets a NIP and revokes a phone, and the next pull and push answer
 * accordingly. The phone is simulated over HTTP (`sync-phone.ts`); its own
 * applier and UI are Maestro's (dispositivo-revocado.yaml and friends).
 *
 * The seed's day is 2026-05-12 (`PORTAL_TODAY`), so every row is dated there
 * and the portal lists it without a period change.
 */
test.describe.configure({ mode: 'serial' });

/** Ana Robledo (seed-data.ts USERS), who may cancel. */
const ANA = '01HZ8XQN9GZJXV8AKQ5X0ANA01';
/** Luis Ortega, whose NIP the owner resets below and this file restores. */
const LUIS = '01HZ8XQN9GZJXV8AKQ5X0EGA01';
const DIA = '2026-05-12';
const T0 = '2026-05-12T19:00:00.000Z';
const T1 = '2026-05-12T19:30:00.000Z';

/**
 * An activation code of this run alone, in the §3 alphabet (no 0/O/1/I): the
 * device is named after its code, and the revoke test finds its card by name,
 * so two runs against one database must not share it (ADR-128's rule).
 */
const codeOf = (): string =>
  `CD${randomUUID().replace(/-/g, '').toUpperCase().replace(/0/g, 'X').replace(/1/g, 'Y').slice(0, 6)}`;
const CODE_A = codeOf();

let a: Phone;
let luisHash = '';

test.beforeAll(async ({ request }) => {
  await asTenant(BIZ, (sql) => sql`UPDATE devices SET revoked_at = now() WHERE revoked_at IS NULL`);
  a = await activatePhone(request, CODE_A);
  const [luis] = await asTenant(
    BIZ,
    (sql) => sql<{ pin_hash: string }[]>`SELECT pin_hash FROM users WHERE id = ${LUIS}`,
  );
  luisHash = luis?.pin_hash ?? '';
});

test.afterAll(async () => {
  // The seed is reference data: Luis's NIP goes back to what the seed hashed.
  if (luisHash !== '')
    await asTenant(BIZ, (sql) => sql`UPDATE users SET pin_hash = ${luisHash} WHERE id = ${LUIS}`);
});

const accepted = async (r: Response | { json(): Promise<unknown> }) =>
  ((await r.json()) as { accepted: { rowId: string }[]; rejected: unknown[] }).accepted.map(
    (x) => x.rowId,
  );

test('a sale cancelled on a phone reaches Movimientos cancelled, with its stock put back', async ({
  page,
  request,
}) => {
  const concepto = `Gringa cancelada ${a.deviceId.slice(-4)}`;
  const t = ticket(a, { fecha: DIA, concepto, createdAt: T0, updatedAt: T0 });
  const linea = sale(a, t.rowId, { fecha: DIA, concepto, createdAt: T0, updatedAt: T0 });
  expect(await accepted(await push(request, a, [t, linea]))).toEqual([t.rowId, linea.rowId]);

  // What CancelarTicketUseCase writes: the ticket marked, its log, the entrada.
  const cancelled = {
    ...t,
    op: 'update',
    clientSeq: 2,
    row: {
      ...t.row,
      cancelMotivo: 'El cliente se arrepintió',
      cancelledByUserId: ANA,
      cancelledAt: T1,
      updatedAt: T1,
    },
  };
  const logId = newUlid();
  const log = {
    table: 'cancelacion_logs',
    rowId: logId,
    op: 'insert',
    clientSeq: 2,
    row: {
      id: logId,
      ticketId: t.rowId,
      cancelledByUserId: ANA,
      motivo: 'El cliente se arrepintió',
      montoOriginalCentavos: 4500n,
      metodoOriginal: 'Efectivo',
      cashReturnedCentavos: 4500n,
      stockReversed: true,
      cantidadDevuelta: 3,
      productoId: TACO,
      businessId: BIZ,
      deviceId: a.deviceId,
      createdByUserId: ANA,
      createdAt: T1,
      updatedAt: T1,
      deletedAt: null,
    },
  };
  const entradaId = newUlid();
  const entrada = {
    table: 'inventory_movements',
    rowId: entradaId,
    op: 'insert',
    clientSeq: 2,
    row: {
      id: entradaId,
      productoId: TACO,
      fecha: DIA,
      tipo: 'entrada',
      cantidad: 3,
      costoUnitCentavos: 980n,
      motivo: 'Devolución de cliente',
      nota: `Cancelación de ${concepto}`,
      origen: 'cancelacion',
      businessId: BIZ,
      deviceId: a.deviceId,
      createdByUserId: ANA,
      createdAt: T1,
      updatedAt: T1,
      deletedAt: null,
    },
  };
  const r = await (await push(request, a, [cancelled, log, entrada])).json();
  expect(r.rejected, JSON.stringify(r.rejected)).toEqual([]);

  const [stored] = await asTenant(
    BIZ,
    (sql) => sql<{ cancelado: string | null; motivo: string; entradas: number }[]>`
      SELECT t.cancelled_at::text AS cancelado, cl.motivo,
             (SELECT count(*)::int FROM inventory_movements m
               WHERE m.id = ${entrada.rowId} AND m.origen = 'cancelacion') AS entradas
      FROM tickets t JOIN cancelacion_logs cl ON cl.ticket_id = t.id
      WHERE t.id = ${t.rowId}`,
  );
  expect(stored?.cancelado).not.toBeNull();
  expect(stored?.motivo).toBe('El cliente se arrepintió');
  expect(stored?.entradas).toBe(1);

  // The owner's day: the row is there, marked, and adds nothing to the total.
  await page.goto(`/movimientos?ir=${DIA}`);
  const fila = page.locator('main').locator('tr', { hasText: concepto }).first();
  await expect(fila).toBeVisible();
  await expect(fila).toContainText('Cancelada');
});

test('a turno closed on a phone with a faltante reaches Cortes with its motivo and note', async ({
  page,
  request,
}) => {
  const turnoId = newUlid();
  const abierto = {
    id: turnoId,
    userId: ANA,
    fecha: DIA,
    aperturaAt: '2026-05-12T14:00:00.000Z',
    cierreAt: null,
    montoAperturaCentavos: 50000n,
    efectivoAdicionalCentavos: 0n,
    montoCierreCentavos: null,
    efectivoEsperadoCentavos: null,
    diferenciaCentavos: null,
    discrepancyReason: null,
    explicacion: null,
    totalTransferencias: 0n,
    totalTarjeta: 0n,
    totalQr: 0n,
    totalCredito: 0n,
    egresoAutoId: null,
    conteoCentavos: null,
    conteoAt: null,
    denominaciones: null,
    businessId: BIZ,
    deviceId: a.deviceId,
    createdByUserId: ANA,
    createdAt: '2026-05-12T14:00:00.000Z',
    updatedAt: '2026-05-12T14:00:00.000Z',
    deletedAt: null,
  };
  const apertura = {
    table: 'caja_turnos',
    rowId: turnoId,
    op: 'insert',
    clientSeq: 3,
    row: abierto,
  };
  const t = ticket(a, { fecha: DIA, cajaTurnoId: turnoId, createdAt: T0, updatedAt: T0 });
  const linea = sale(a, t.rowId, { fecha: DIA, createdAt: T0, updatedAt: T0 });
  expect(await accepted(await push(request, a, [apertura, t, linea]))).toHaveLength(3);

  // The close: $500 fondo + $45 cash sale expected, $525 counted → −$20,
  // «Cambio mal dado» in the operator's words, with a note.
  const cerrado = {
    ...apertura,
    op: 'update',
    clientSeq: 4,
    row: {
      ...abierto,
      cierreAt: '2026-05-12T20:00:00.000Z',
      efectivoEsperadoCentavos: 54500n,
      montoCierreCentavos: 52500n,
      conteoCentavos: 52500n,
      conteoAt: '2026-05-12T20:00:00.000Z',
      diferenciaCentavos: -2000n,
      discrepancyReason: 'error-en-cambio',
      explicacion: 'Se me fue un cambio con un cliente',
      denominaciones: { 'billete-500': 1, 'billete-20': 1, 'moneda-5': 1 },
      updatedAt: '2026-05-12T20:00:00.000Z',
    },
  };
  const r = await (await push(request, a, [cerrado])).json();
  expect(r.rejected, JSON.stringify(r.rejected)).toEqual([]);

  await page.goto('/cortes');
  const fila = page.getByRole('row', { name: /Ana Robledo.*12 may/ }).first();
  await expect(fila).toBeVisible();
  await expect(fila).toContainText('−$20.00');
  await fila.click();
  const panel = page.getByRole('dialog', { name: 'Ana Robledo' });
  await expect(panel.getByText('Falta', { exact: true })).toBeVisible();
  await expect(panel.getByText('Cambio mal dado', { exact: true })).toBeVisible();
  await expect(panel.getByText('«Se me fue un cambio con un cliente»')).toBeVisible();
});

test('a NIP reset in the portal reaches the phone on its next pull, and the old NIP is dead', async ({
  page,
  request,
}) => {
  const cursor = (await pull(request, a, a.cursor)).serverSeq;
  await page.goto('/equipo');
  // The operator card: the div holding the name and its own «Desactivar».
  const card = page
    .locator('main')
    .locator('div', { has: page.getByText('Luis Ortega', { exact: true }) })
    .filter({ has: page.getByRole('button', { name: 'Desactivar' }) })
    .last();
  await card.getByRole('button', { name: 'Reiniciar NIP' }).click();
  await page.getByTestId('operador-nuevo-pin').fill('7171');
  await page.getByTestId('operador-nuevo-pin-confirmar').fill('7171');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const got = await pull(request, a, cursor);
  const luis = got.tables.users.find((u: { id: string }) => u.id === LUIS);
  expect(luis, 'the reset user rides the next pull').toBeDefined();
  expect(await compare('7171', luis.pinHash)).toBe(true);
  expect(await compare('2580', luis.pinHash)).toBe(false);
});

test("a revoked phone's push is refused, and after re-pairing the same rows land once", async ({
  page,
  request,
}) => {
  const t = ticket(a, { fecha: DIA, createdAt: T1, updatedAt: T1 });
  const linea = sale(a, t.rowId, { fecha: DIA, createdAt: T1, updatedAt: T1 });

  // The owner revokes the caja from Equipo → Cajas.
  await page.goto('/equipo');
  await page
    .getByRole('group', { name: 'Equipo y nómina' })
    .getByRole('button', { name: /Cajas/ })
    .click();
  // The device card (device-cards.tsx): the name is the code it was minted with.
  const caja = page
    .locator('main')
    .locator('div', { has: page.getByText(CODE_A, { exact: true }) })
    .filter({ has: page.getByRole('button', { name: 'Revocar' }) })
    .last();
  await caja.getByRole('button', { name: 'Revocar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Revocar' }).click();
  // The dialog closes once the action has answered. «Revocado» alone proves
  // nothing: earlier files' cajas already read it, and the push below used to
  // win the race against a revoke that had not landed yet.
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Revocado').first()).toBeVisible();

  // Its token is dead for pushes and pulls alike: nothing of this ticket lands.
  const refused = await push(request, a, [t, linea]);
  expect(refused.status()).toBe(401);
  expect((await refused.json()).error.code).toBe('DEVICE_REVOKED');
  const refusedPull = await request.get(`${API_PATHS.syncPull}?since=0`, {
    headers: deviceHeaders(a.token),
  });
  expect(refusedPull.status()).toBe(401);
  const [before] = await asTenant(
    BIZ,
    (sql) => sql<{ n: number }[]>`SELECT count(*)::int AS n FROM tickets WHERE id = ${t.rowId}`,
  );
  expect(before?.n).toBe(0);

  // A fresh code links the phone again; the rows it kept go up once.
  const again = await activatePhone(request, codeOf());
  const retry = [
    { ...t, row: { ...t.row, deviceId: again.deviceId } },
    { ...linea, row: { ...linea.row, deviceId: again.deviceId } },
  ];
  expect(await accepted(await push(request, again, retry))).toEqual([t.rowId, linea.rowId]);
  expect(await accepted(await push(request, again, retry))).toEqual([t.rowId, linea.rowId]);
  const [after] = await asTenant(
    BIZ,
    (sql) => sql<{ n: number }[]>`SELECT count(*)::int AS n FROM tickets WHERE id = ${t.rowId}`,
  );
  expect(after?.n).toBe(1);
});
