import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  assertPuedeCerrar,
  assertPuedePedirReabrir,
  assertPuedeResponder,
  assertSaldoCoincide,
  CierreError,
  estadoDelCierre,
  ultimoDia,
  type EventoCierre,
  type PasoDelCierre,
} from '../../src/corp/cierre/index.js';

const hechos: readonly PasoDelCierre[] = [
  { id: 'emitidas', estado: 'hecho' },
  { id: 'ingresos', estado: 'no_aplica' },
  { id: 'banco', estado: 'hecho' },
];

const cerrar = {
  periodo: '2026-10',
  mesActual: '2026-11',
  pasos: hechos,
  cerrados: new Set(['2026-08', '2026-09']),
  conMovimientos: new Set(['2026-08', '2026-09', '2026-10', '2026-11']),
};

const falla = (fn: () => unknown, code: string, message?: RegExp) =>
  assert.throws(fn, (e: unknown) => {
    assert.ok(e instanceof CierreError);
    assert.equal(e.code, code);
    if (message !== undefined) assert.match(e.message, message);
    return true;
  });

const ev = (kind: EventoCierre['kind'], founderId: string, motivo: string | null = null) => ({
  kind,
  founderId,
  motivo,
  at: '2026-11-21T16:42:00.000Z',
});

describe('assertPuedeCerrar (E-14)', () => {
  it('closes a finished month with every step done or not needed', () => {
    assert.doesNotThrow(() => assertPuedeCerrar(cerrar));
  });

  it('refuses the month in progress, and one already closed', () => {
    falla(() => assertPuedeCerrar({ ...cerrar, periodo: '2026-11' }), 'MES_EN_CURSO', /^Noviembre/);
    falla(() => assertPuedeCerrar({ ...cerrar, periodo: '2026-09' }), 'MES_CERRADO');
  });

  it('closes in order: an earlier month with movements still open comes first', () => {
    const cerrados = new Set(['2026-08']);
    falla(() => assertPuedeCerrar({ ...cerrar, cerrados }), 'MES_ANTERIOR_ABIERTO', /septiembre/);
    // A month without movements never blocks.
    const sinSept = new Set(['2026-08', '2026-10']);
    assert.doesNotThrow(() => assertPuedeCerrar({ ...cerrar, cerrados, conMovimientos: sinSept }));
  });

  it('counts the steps still pending', () => {
    const pasos: readonly PasoDelCierre[] = [...hechos, { id: 'estados', estado: 'pendiente' }];
    falla(() => assertPuedeCerrar({ ...cerrar, pasos }), 'PASOS_PENDIENTES', /Falta 1 paso/);
    const dos: readonly PasoDelCierre[] = [...pasos, { id: 'agenda', estado: 'pendiente' }];
    falla(() => assertPuedeCerrar({ ...cerrar, pasos: dos }), 'PASOS_PENDIENTES', /Faltan 2/);
  });

  it('refuses something that is not a month', () => {
    falla(() => assertPuedeCerrar({ ...cerrar, periodo: '2026-13' }), 'MES_INVALIDO');
  });
});

describe('estadoDelCierre', () => {
  it('reads closed, a pending request, and a reopening', () => {
    assert.deepEqual(estadoDelCierre([]), { cerrado: false, pedido: null });
    const pedido = [ev('cerrado', 'f1'), ev('reapertura_pedida', 'f1', 'Falta la comisión')];
    assert.equal(estadoDelCierre(pedido).cerrado, true);
    assert.equal(estadoDelCierre(pedido).pedido?.motivo, 'Falta la comisión');
    assert.equal(estadoDelCierre([...pedido, ev('reapertura_rechazada', 'f2')]).pedido, null);
    assert.deepEqual(estadoDelCierre([...pedido, ev('reabierto', 'f2')]), {
      cerrado: false,
      pedido: null,
    });
    assert.equal(
      estadoDelCierre([...pedido, ev('reabierto', 'f2'), ev('cerrado', 'f1')]).cerrado,
      true,
    );
  });
});

describe('reopening takes both founders', () => {
  const cerrado = estadoDelCierre([ev('cerrado', 'f1')]);
  const pedir = {
    periodo: '2026-10',
    cerrados: new Set(['2026-09', '2026-10']),
    estado: cerrado,
    motivo: 'Falta la comisión',
  };

  it('asks with a reason, and only the other founder answers', () => {
    assert.doesNotThrow(() => assertPuedePedirReabrir(pedir));
    const pedido = estadoDelCierre([ev('cerrado', 'f1'), ev('reapertura_pedida', 'f1', 'x')]);
    assert.equal(assertPuedeResponder('2026-10', pedido, 'f2').founderId, 'f1');
    falla(() => assertPuedeResponder('2026-10', pedido, 'f1'), 'MISMO_SOCIO');
  });

  it('refuses an open month, a blank reason and a second request', () => {
    falla(
      () => assertPuedePedirReabrir({ ...pedir, cerrados: new Set(['2026-09']) }),
      'MES_ABIERTO',
    );
    falla(() => assertPuedePedirReabrir({ ...pedir, motivo: '  ' }), 'MOTIVO_REAPERTURA');
    const pedido = estadoDelCierre([ev('cerrado', 'f1'), ev('reapertura_pedida', 'f1', 'x')]);
    falla(() => assertPuedePedirReabrir({ ...pedir, estado: pedido }), 'REAPERTURA_PENDIENTE');
  });

  it('reopens from the newest back', () => {
    const cerrados = new Set(['2026-09', '2026-10', '2026-11']);
    falla(
      () => assertPuedePedirReabrir({ ...pedir, cerrados }),
      'MES_POSTERIOR_CERRADO',
      /noviembre/,
    );
  });

  it('cannot answer a request nobody made', () => {
    falla(() => assertPuedeResponder('2026-10', cerrado, 'f2'), 'SIN_REAPERTURA');
  });
});

describe('the bank balance', () => {
  it('is confirmed only when the statement equals the ledger', () => {
    assert.doesNotThrow(() => assertSaldoCoincide('2026-10', 48_210_55n, 48_210_55n));
    falla(() => assertSaldoCoincide('2026-10', 48_210_55n, 48_193_15n), 'SALDO_NO_COINCIDE');
  });

  it('is read at the month’s last day', () => {
    assert.equal(ultimoDia('2026-10'), '2026-10-31');
    assert.equal(ultimoDia('2026-11'), '2026-11-30');
    assert.equal(ultimoDia('2028-02'), '2028-02-29');
  });
});
