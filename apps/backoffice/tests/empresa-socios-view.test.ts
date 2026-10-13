import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { LlamadaConEstado, Movimiento } from '@xangarro/data-corp';
import { postMovement, type Movement } from '@xangarro/domain/corp';

import { estadoMitad, filaSocio, llamadaAbierta } from '../src/server/empresa/socios-view';

/** E-03's board in words: the halves of a call and the partner history. */
describe('estadoMitad', () => {
  it('shows a paid half with its day', () => {
    assert.deepEqual(
      estadoMitad({ entryId: 'e', fecha: '2026-10-06' }, '2026-10-15', '2026-10-08'),
      {
        label: 'Pagado',
        detalle: 'el 6 oct',
        tono: 'ok',
      },
    );
  });

  it('counts the days left on an unpaid half', () => {
    assert.equal(estadoMitad(null, '2026-10-15', '2026-10-08').detalle, 'faltan 7 días');
    assert.equal(estadoMitad(null, '2026-10-09', '2026-10-08').detalle, 'falta 1 día');
    assert.equal(estadoMitad(null, '2026-10-08', '2026-10-08').detalle, 'vence hoy');
  });

  it('marks an unpaid half past its deadline', () => {
    const e = estadoMitad(null, '2026-10-05', '2026-10-08');
    assert.equal(e.label, 'Vencido');
    assert.equal(e.detalle, 'venció hace 3 días');
    assert.equal(e.tono, 'bad');
  });
});

describe('llamadaAbierta', () => {
  const call = (id: string, pagadas: [boolean, boolean]): LlamadaConEstado => ({
    id,
    concepto: id,
    total: 2n,
    porSocio: 1n,
    vence: '2026-10-15',
    createdBy: 'f',
    mitades: {
      1: pagadas[0] ? { entryId: 'a', fecha: '2026-10-01' } : null,
      2: pagadas[1] ? { entryId: 'b', fecha: '2026-10-01' } : null,
    },
  });

  it('picks the newest call with a half unpaid', () => {
    assert.equal(llamadaAbierta([call('a', [true, true]), call('b', [true, false])])?.id, 'b');
  });

  it('has none when every half is paid', () => {
    assert.equal(llamadaAbierta([call('a', [true, true])]), null);
  });
});

describe('filaSocio', () => {
  const nombres = { 1: 'Fundador 1 · Ana', 2: 'Fundador 2 · Beto' } as const;
  const mov = (movement: Movement, reversesEntryId: string | null = null): Movimiento => ({
    id: 'm',
    fecha: '2026-10-06',
    projectId: null,
    kind: movement.kind,
    concepto: 'Dinero',
    contraparte: null,
    moneda: 'MXN',
    montoOriginal: null,
    tipoCambio: null,
    deducible: null,
    source: 'manual',
    sourceRef: null,
    reversesEntryId,
    payload: movement,
    createdBy: 'f',
    createdAt: '2026-10-06T10:00:00Z',
    reversedBy: null,
    lines: postMovement(movement),
  });

  it('names the movement, the partner and the amount', () => {
    const f = filaSocio(mov({ kind: 'fondeo_mitades', socio: 2, monto: 10_000_00n }), nombres);
    assert.deepEqual(
      [f.fecha, f.tipo, f.quien, f.monto],
      ['6 oct', 'Fondeo por mitades', 'Fundador 2 · Beto', '$10,000.00'],
    );
  });

  it('shows a repayment as money going back to the partner', () => {
    assert.equal(
      filaSocio(mov({ kind: 'reembolso_socio', socio: 1, monto: 3_000_00n }), nombres).monto,
      '−$3,000.00',
    );
  });

  it('shows the excess moved to a loan once, not twice', () => {
    const f = filaSocio(
      mov({ kind: 'excedente_a_prestamo', socio: 1, monto: 10_000_00n }),
      nombres,
    );
    assert.equal(f.monto, '$10,000.00');
    assert.equal(f.tipo, 'Excedente a préstamo');
  });

  it('labels a reversal', () => {
    const f = filaSocio(mov({ kind: 'prestamo_socio', socio: 1, monto: 1_00n }, 'x'), nombres);
    assert.equal(f.tipo, 'Reversa: Préstamo a la empresa');
  });
});
