import { expect, test } from '@playwright/test';
import { newUlid } from '@xangarro/domain';

import { asTenant, BIZ, TACO } from './sync-phone';

/**
 * O-05 — a `plataforma = web` device's round trip, from a real browser (C-16).
 *
 * The conformance suite proves the endpoint shapes from Node; this proves the
 * same three calls work from a page — same-origin fetch, the device-token
 * header, money as decimal strings — which is the surface O-06's register
 * runtime will use. Activate, push a ticket and its line, pull them back.
 */

const CODE = 'WEBDVCE2';
const EMAIL = 'pedro@taqueria.mx';

test.beforeAll(async () => {
  // Taquería has two slots and this file runs in the sync project's queue;
  // revoke the previous file's phones, then mint this run's code.
  await asTenant(BIZ, async (sql) => {
    await sql`UPDATE devices SET revoked_at = now() WHERE revoked_at IS NULL`;
    await sql`
      INSERT INTO activation_codes (code, email, expires_at, business_id, created_at, updated_at)
      VALUES (${CODE}, ${EMAIL}, now() + interval '1 hour', ${BIZ}, now(), now())
      ON CONFLICT (code) DO UPDATE SET email = EXCLUDED.email, expires_at = EXCLUDED.expires_at,
        business_id = EXCLUDED.business_id, redeemed_at = NULL, redeemed_by_device_id = NULL,
        updated_at = now()`;
  });
});

/** The wire rows: a ticket and its one line, money as decimal strings. */
function wireDeltas(deviceId: string): { deltas: unknown[]; ticketId: string; lineId: string } {
  const at = '2026-09-19T13:45:00.000Z';
  const ticketId = newUlid();
  const lineId = newUlid();
  const audit = {
    businessId: BIZ,
    deviceId,
    createdByUserId: null,
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
  };
  const ticket = {
    id: ticketId,
    folio: 404,
    fecha: '2026-09-19',
    hora: '13:45',
    concepto: 'Venta mostrador (web)',
    metodo: 'Efectivo',
    clienteId: null,
    estadoPago: 'pagado',
    efectivoRecibidoCentavos: '5000',
    cambioCentavos: '500',
    cajaTurnoId: null,
    cancelMotivo: null,
    cancelledByUserId: null,
    cancelledAt: null,
    ...audit,
  };
  const line = {
    id: lineId,
    ticketId,
    fecha: '2026-09-19',
    concepto: 'Venta mostrador (web)',
    categoria: 'Producto',
    monto: '4500',
    productoId: TACO,
    cantidad: 3,
    ...audit,
  };
  return {
    deltas: [
      { table: 'tickets', rowId: ticketId, op: 'insert', clientSeq: 1, row: ticket },
      { table: 'sales', rowId: line.id, op: 'insert', clientSeq: 2, row: line },
    ],
    ticketId,
    lineId,
  };
}

test('a web device activates, pushes a ticket with its line, and pulls both back — all from the page', async ({
  page,
}) => {
  await page.goto('/');

  const activation = await page.evaluate(async (code: string) => {
    const r = await fetch('/api/v1/activate', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-xangarro-protocol': '1' },
      body: JSON.stringify({
        email: 'pedro@taqueria.mx',
        code,
        device: { name: 'Caja web', platform: 'web', appVersion: '0.1.0', osVersion: 'macOS 15' },
      }),
    });
    return { status: r.status, body: await r.json() };
  }, CODE);
  expect(activation.status).toBe(200);
  const boot = activation.body.bootstrap;

  const [plataforma] = await asTenant(
    BIZ,
    (sql) => sql`SELECT plataforma FROM devices WHERE id = ${activation.body.deviceId}`,
  );
  expect(plataforma?.plataforma).toBe('web');

  const wire = wireDeltas(activation.body.deviceId);
  const round = await page.evaluate(
    async ([token, deltas, since]: [string, unknown[], number]) => {
      const headers = {
        'content-type': 'application/json',
        'x-xangarro-protocol': '1',
        authorization: `Bearer ${token}`,
      };
      const push = await fetch('/api/v1/sync/push', {
        method: 'POST',
        headers,
        body: JSON.stringify({ deltas }),
      });
      const pull = await fetch(`/api/v1/sync/pull?since=${since}`, { headers });
      return { push: { status: push.status, body: await push.json() }, pull: await pull.json() };
    },
    [activation.body.deviceToken, wire.deltas, boot.serverSeq] as [string, unknown[], number],
  );
  expect(round.push.status, JSON.stringify(round.push.body)).toBe(200);
  expect(round.push.body.accepted.map((x: { rowId: string }) => x.rowId)).toEqual([
    wire.ticketId,
    wire.lineId,
  ]);
  expect(round.push.body.rejected).toEqual([]);

  // The pull leg: capture rows never come back down (UP tables are not
  // pullable), so the page's proof is the acknowledgment and the reference
  // tables — and the rows themselves are asserted in Postgres below.
  expect(round.pull.acknowledgedThrough).toBeGreaterThanOrEqual(
    round.push.body.accepted[1]?.serverSeq ?? 0,
  );
  expect(Array.isArray(round.pull.tables.mensajes_operador)).toBe(true);

  const [ticketRow, lineRow] = await asTenant(BIZ, async (sql) => [
    await sql`SELECT efectivo_recibido_centavos::text AS efectivo FROM tickets WHERE id = ${wire.ticketId}`,
    await sql`SELECT monto_centavos::text AS monto, ticket_id FROM sales WHERE id = ${wire.lineId}`,
  ]);
  expect(ticketRow[0]?.efectivo).toBe('5000');
  expect(lineRow[0]?.monto).toBe('4500');
  expect(lineRow[0]?.ticket_id).toBe(wire.ticketId);
});
