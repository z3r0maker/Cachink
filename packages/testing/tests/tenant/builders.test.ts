// @vitest-environment node
import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  client,
  clientIp,
  codeOf,
  gasto,
  respuesta,
  sale,
  stamp,
  subscriptionIdOf,
  TACO,
  ticket,
  turno,
} from '../../src/tenant/index.js';

/**
 * The hermetic half of `@xangarro/testing/tenant`: identities and wire rows,
 * which need no database. `tenant.integration.test.ts` covers the rest.
 */
const PHONE = { businessId: '01HZ8XQN9GZJXV8AKQ5X0BIZ01', deviceId: '01HZ8XQN9GZJXV8AKQ5X0DEV01' };

describe('identities', () => {
  it('stamp() carries the pid and never repeats', () => {
    const seen = new Set(Array.from({ length: 500 }, () => stamp()));
    assert.equal(seen.size, 500);
    for (const s of seen) assert.match(s, new RegExp(`^${process.pid}-[0-9a-f-]{12}$`));
  });

  it('stamp() holds no clock, so two workers in one millisecond cannot collide', () => {
    const s = stamp();
    assert.doesNotMatch(s, new RegExp(String(Date.now()).slice(0, 8)));
  });

  it('clientIp() is a documentation address, stable within a process', () => {
    assert.equal(clientIp(), clientIp());
    assert.match(clientIp(), /^203\.0\.113\.(\d{1,3})$/);
    const last = Number(clientIp().split('.').at(-1));
    assert.ok(last >= 1 && last <= 250, `octet ${last} outside 1–250`);
  });

  it('subscriptionIdOf() is the id mintTenant writes, capped at 40 characters', () => {
    const biz = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
    assert.equal(subscriptionIdOf({ biz }), `sub_${biz.slice(-12)}`);
    assert.equal(subscriptionIdOf({ biz: 'x'.repeat(80) }).length, 16);
    assert.equal(subscriptionIdOf({ biz: 'short' }), 'sub_short');
  });

  it('codeOf() stays inside the activation alphabet and never repeats', () => {
    const codes = Array.from({ length: 300 }, () => codeOf());
    assert.equal(new Set(codes).size, codes.length);
    for (const c of codes) {
      assert.match(c, /^TP[A-Z2-9]{6}$/);
      assert.doesNotMatch(c, /[01OI]/);
    }
  });
});

describe('wire rows', () => {
  it('ticket() is an insert delta for the phone, with a fresh folio each time', () => {
    const a = ticket(PHONE);
    const b = ticket(PHONE);
    assert.equal(a.table, 'tickets');
    assert.equal(a.op, 'insert');
    assert.equal(a.rowId, a.row.id);
    assert.equal(a.row.businessId, PHONE.businessId);
    assert.equal(b.row.folio, a.row.folio + 1);
  });

  it('ticket() and sale() take overrides last, so a spec can change any field', () => {
    const t = ticket(PHONE, { metodo: 'Tarjeta', estadoPago: 'pendiente' });
    assert.equal(t.row.metodo, 'Tarjeta');
    assert.equal(t.row.estadoPago, 'pendiente');
    const s = sale(PHONE, t.rowId, { productoId: null, monto: 1n });
    assert.equal(s.row.ticketId, t.rowId);
    assert.equal(s.row.productoId, null);
    assert.equal(s.row.monto, 1n);
  });

  it('money on the wire is bigint centavos, never a float', () => {
    const t = ticket(PHONE);
    const s = sale(PHONE, t.rowId);
    assert.equal(typeof t.row.efectivoRecibidoCentavos, 'bigint');
    assert.equal(typeof s.row.monto, 'bigint');
    assert.equal(s.row.productoId, TACO);
  });

  it('client() names the client and leaves the optional contact fields null', () => {
    const c = client(PHONE, 'Doña Mari');
    assert.equal(c.row.nombre, 'Doña Mari');
    assert.deepEqual([c.row.telefono, c.row.email, c.row.nota], [null, null, null]);
  });
});

describe('phone rows', () => {
  const open = {
    id: '01HZ8XQN9GZJXV8AKQ5X0TUR01',
    userId: '01HZ8XQN9GZJXV8AKQ5X0USR01',
    fecha: '2026-09-17',
    aperturaAt: '2026-09-17T14:00:00.000Z',
    fondo: 50_000n,
  };

  it('an open turno is an insert with nothing of the close filled in', () => {
    const d = turno(PHONE, open);
    assert.equal(d.op, 'insert');
    assert.equal(d.row.cierreAt, null);
    assert.equal(d.row.diferenciaCentavos, null);
    assert.equal(d.row.updatedAt, open.aperturaAt);
  });

  it('a closed turno is an update that derives Contado and the difference from the count', () => {
    const d = turno(PHONE, open, {
      at: '2026-09-17T22:00:00.000Z',
      esperado: 60_000n,
      conteo: { 'billete-500': 1 },
      motivo: 'error_cambio',
    });
    assert.equal(d.op, 'update');
    assert.equal(d.row.montoCierreCentavos, 50_000n);
    assert.equal(d.row.diferenciaCentavos, -10_000n);
    assert.equal(d.row.discrepancyReason, 'error_cambio');
    assert.equal(d.row.updatedAt, '2026-09-17T22:00:00.000Z');
  });

  it('a close without a reason or a note leaves both null', () => {
    const d = turno(PHONE, open, { at: open.aperturaAt, esperado: 0n, conteo: {} });
    assert.equal(d.row.diferenciaCentavos, 0n);
    assert.equal(d.row.discrepancyReason, null);
    assert.equal(d.row.explicacion, null);
  });

  it('a close refuses a count the domain refuses: negative or fractional pieces', () => {
    const close = (n: number) => () =>
      turno(PHONE, open, { at: open.aperturaAt, esperado: 0n, conteo: { 'moneda-10': n } });
    assert.throws(close(-1), { name: 'CorteInvalidoError' });
    assert.throws(close(1.5), { name: 'CorteInvalidoError' });
  });

  it('gasto() and respuesta() are attributed to the phone and to who wrote them', () => {
    const g = gasto(PHONE, {
      fecha: '2026-09-17',
      concepto: 'Gas',
      categoria: 'Servicios',
      monto: 18_000n,
      at: open.aperturaAt,
    });
    assert.equal(g.row.gastoRecurrenteId, null);
    assert.equal(g.row.cajaTurnoId, null);
    assert.equal(g.row.createdByUserId, null);
    const r = respuesta(PHONE, 'msg-1', 'Listo', open.userId, open.aperturaAt);
    assert.equal(r.table, 'respuestas_operador');
    assert.equal(r.row.createdByUserId, open.userId);
  });
});
