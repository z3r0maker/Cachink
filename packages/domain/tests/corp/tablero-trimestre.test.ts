import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  resumenDelTrimestre,
  type EventoPlan,
  type Tarjeta,
} from '../../src/corp/tablero/index.js';
import { ev, tarjeta } from './tablero-fixture.js';

/** The 4T 2026 of board CD-13b: F1 committed $60,000, F2 $70,000. */
const plan4T: EventoPlan[] = [
  { trimestre: '2026-T4', tipo: 'enviado', socio: 1, fecha: '2026-10-01' },
  { trimestre: '2026-T4', tipo: 'aprobado', socio: 2, fecha: '2026-10-03' },
];

const cuarto = (lanzamiento: string): Tarjeta[] => [
  tarjeta({ id: 'referidos', valores: { 1: 20_000_00n, 2: 30_000_00n } }),
  tarjeta({ id: 'lanzamiento', eventos: [ev('terminada', lanzamiento, 1)] }),
  tarjeta({
    id: 'alianza',
    responsable: 2,
    valores: { 1: 10_000_00n, 2: 40_000_00n },
    cotizacion: 30_000_00n,
    eventos: [ev('iniciada', '2026-10-10', 2)],
  }),
  tarjeta({
    id: 'marketing',
    responsable: 2,
    valores: { 1: 20_000_00n, 2: 20_000_00n },
    eventos: [ev('terminada', '2026-10-24', 2)],
  }),
  tarjeta({
    id: 'guia',
    responsable: 2,
    valores: { 1: 20_000_00n, 2: 20_000_00n },
    eventos: [ev('terminada', '2026-11-10', 2), ev('objetada', '2026-11-14', 1)],
  }),
  tarjeta({
    id: 'banco',
    tipo: 'tarea',
    valores: { 1: null, 2: null },
    eventos: [ev('hecha', '2026-10-28', 1)],
  }),
];

const resumen = (
  hoy: string,
  tarjetas = cuarto('2026-11-12'),
  planes = plan4T,
  trimestre = '2026-T4',
) => resumenDelTrimestre({ trimestre, tarjetas, planes, hoy });

describe('resumenDelTrimestre (OD-4 §4, §5)', () => {
  it('commits each partner to their valued deliverables of the approved plan', () => {
    const r = resumen('2026-11-15');
    assert.equal(r.plan.fase, 'aprobado');
    assert.equal(r.socios[0].comprometido, 60_000_00n);
    assert.equal(r.socios[1].comprometido, 70_000_00n);
    assert.equal(r.socios[0].fuente, 'plan');
  });

  it('accepted and in review, objected included, while the quarter runs', () => {
    const r = resumen('2026-11-15');
    assert.deepEqual(
      r.socios.map((s) => [s.aceptado, s.enRevision]),
      [
        [0n, 35_000_00n],
        [20_000_00n, 20_000_00n],
      ],
    );
    assert.equal(r.decidido, false);
    assert.equal(r.socios[0].cumple, null);
  });

  it('places each card in its column', () => {
    const col = Object.fromEntries(
      resumen('2026-11-15').tarjetas.map((t) => [t.tarjeta.id, t.columna]),
    );
    assert.deepEqual(col, {
      referidos: 'por_hacer',
      lanzamiento: 'en_revision',
      alianza: 'en_curso',
      marketing: 'terminado',
      guia: 'en_revision',
      banco: 'terminado',
    });
  });

  it('the close waits for a card finished in the quarter until its window ends', () => {
    const espera = resumen('2027-01-05', cuarto('2026-12-29'));
    assert.equal(espera.terminado, true);
    assert.equal(espera.decidido, false);
    assert.equal(espera.cierraEl, '2027-01-08');
    assert.equal(espera.pendientes, 1);
  });

  it('then each partner cumple with half of the commitment accepted', () => {
    const r = resumen('2027-01-09', cuarto('2026-12-29'));
    assert.equal(r.decidido, true);
    assert.deepEqual(
      r.socios.map((s) => [s.aceptado, s.porcentaje, s.cumple]),
      [
        [35_000_00n, 58, true],
        [20_000_00n, 29, false],
      ],
    );
    assert.equal(r.incumple, 2);
    assert.deepEqual(
      r.arrastre.map((t) => t.tarjeta.id),
      ['referidos', 'alianza', 'guia'],
    );
  });

  it('unaccepted cards roll over with their value and count again', () => {
    const planes = [
      ...plan4T,
      { trimestre: '2027-T1', tipo: 'enviado', socio: 2, fecha: '2026-12-20' },
      { trimestre: '2027-T1', tipo: 'aprobado', socio: 1, fecha: '2027-01-02' },
    ] satisfies EventoPlan[];
    const r = resumen('2027-01-09', cuarto('2026-12-29'), planes, '2027-T1');
    assert.equal(r.socios[0].comprometido, 25_000_00n);
    assert.equal(r.socios[1].comprometido, 50_000_00n);
    assert.ok(r.tarjetas.every((t) => t.arrastrada));
  });

  it("with no plan approved by day 10, the commitment is the previous quarter's", () => {
    const r = resumen('2027-01-11', cuarto('2026-12-29'), plan4T, '2027-T1');
    assert.equal(r.plan.fase, 'borrador');
    assert.equal(r.limitePlan, '2027-01-10');
    assert.deepEqual(
      r.socios.map((s) => [s.comprometido, s.fuente]),
      [
        [60_000_00n, 'anterior'],
        [70_000_00n, 'anterior'],
      ],
    );
  });

  it("flags a commitment under half the other's while the plan is built", () => {
    const plan = [
      tarjeta({
        id: 'a',
        trimestre: '2027-T1',
        vence: '2027-02-01',
        valores: { 1: 25_000_00n, 2: 25_000_00n },
      }),
      tarjeta({
        id: 'b',
        trimestre: '2027-T1',
        vence: '2027-02-01',
        responsable: 2,
        valores: { 1: 60_000_00n, 2: 60_000_00n },
      }),
    ];
    const r = resumen('2026-12-20', plan, [], '2027-T1');
    assert.equal(r.socios[0].fuente, 'borrador');
    assert.equal(r.desbalance, 1);
  });

  it('when both fall short no consequence is raised', () => {
    const nada = cuarto('2026-11-12').map((t) =>
      t.id === 'lanzamiento' || t.id === 'marketing' ? { ...t, eventos: [] } : t,
    );
    const r = resumen('2027-01-09', nada);
    assert.deepEqual(
      r.socios.map((s) => s.cumple),
      [false, false],
    );
    assert.equal(r.incumple, null);
  });

  it('a partner with nothing committed cumple', () => {
    const r = resumen('2027-01-09', [], plan4T);
    assert.deepEqual(
      r.socios.map((s) => [s.comprometido, s.porcentaje, s.cumple]),
      [
        [0n, null, true],
        [0n, null, true],
      ],
    );
  });

  it('a card taken off a plan is not alive from that quarter on', () => {
    const fuera = cuarto('2026-12-29').map((t) =>
      t.id === 'referidos' ? { ...t, descartadaEn: '2027-T1' } : t,
    );
    const t1 = resumen('2027-01-09', fuera, plan4T, '2027-T1');
    assert.ok(!t1.tarjetas.some((t) => t.tarjeta.id === 'referidos'));
    const t4 = resumen('2027-01-09', fuera);
    assert.ok(t4.arrastre.some((t) => t.tarjeta.id === 'referidos'));
  });
});
