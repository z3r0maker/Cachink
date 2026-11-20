import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  assertClausula,
  assertNuevoObjetivo,
  assertPuedeAvanzar,
  assertPuedeMarcarEnviado,
  avisoDelCierre,
  resultadoDelObjetivo,
  resumenDelTrimestre,
  TableroError,
  textoDelAviso,
  type EventoPlan,
} from '../../src/corp/tablero/index.js';
import { ev, objetivo, tarjeta } from './tablero-fixture.js';

const codigo = (code: string) => (e: unknown) => e instanceof TableroError && e.code === code;

describe('objectives (OD-4 §7)', () => {
  const nuevo = {
    trimestre: '2027-T1',
    hoy: '2026-12-20',
    quien: 2 as const,
    titulo: ' 90 negocios pagando ',
    meta: 90,
    unidad: ' negocios ',
  };

  it('are typed in for this quarter or the next plan, with a whole goal and its unit', () => {
    assert.deepEqual(assertNuevoObjetivo(nuevo), {
      ...nuevo,
      titulo: '90 negocios pagando',
      unidad: 'negocios',
    });
    assert.throws(() => assertNuevoObjetivo({ ...nuevo, meta: 1.5 }), codigo('OBJETIVO_META'));
    assert.throws(() => assertNuevoObjetivo({ ...nuevo, unidad: '' }), codigo('OBJETIVO_META'));
    assert.throws(() => assertNuevoObjetivo({ ...nuevo, titulo: '' }), codigo('OBJETIVO_TITULO'));
    assert.throws(
      () => assertNuevoObjetivo({ ...nuevo, trimestre: '2026-T3' }),
      codigo('TARJETA_TRIMESTRE'),
    );
  });

  it('progress is updated by hand, dated, inside its quarter', () => {
    const o = objetivo();
    assertPuedeAvanzar(o, { valor: 48, hoy: '2026-11-15' });
    assert.throws(
      () => assertPuedeAvanzar(o, { valor: -1, hoy: '2026-11-15' }),
      codigo('AVANCE_VALOR'),
    );
    assert.throws(
      () => assertPuedeAvanzar(o, { valor: 52, hoy: '2027-01-01' }),
      codigo('OBJETIVO_CERRADO'),
    );
    assert.throws(
      () => assertPuedeAvanzar(o, { valor: 1, hoy: '2026-09-30' }),
      codigo('OBJETIVO_AUN_NO'),
    );
  });

  it('is measured at the close: the last progress against its goal', () => {
    const o = objetivo({
      avances: [
        { valor: 48, fecha: '2026-11-15', socio: 2 },
        { valor: 52, fecha: '2026-12-30', socio: 2 },
      ],
    });
    assert.deepEqual(resultadoDelObjetivo(o, '2026-12-31'), { avance: 52, cumplido: null });
    assert.deepEqual(resultadoDelObjetivo(o, '2027-01-01'), { avance: 52, cumplido: false });
    assert.deepEqual(
      resultadoDelObjetivo(objetivo({ meta: 50, avances: o.avances }), '2027-01-01'),
      {
        avance: 52,
        cumplido: true,
      },
    );
    assert.deepEqual(resultadoDelObjetivo(objetivo(), '2026-11-01'), { avance: 0, cumplido: null });
  });
});

const planes: EventoPlan[] = [
  { trimestre: '2026-T4', tipo: 'enviado', socio: 1, fecha: '2026-10-01' },
  { trimestre: '2026-T4', tipo: 'aprobado', socio: 2, fecha: '2026-10-03' },
];
const tarjetas = [
  tarjeta({ id: 'lanz', eventos: [ev('terminada', '2026-11-12', 1)] }),
  tarjeta({
    id: 'alianza',
    titulo: 'Alianza con una distribuidora',
    responsable: 2,
    valores: { 1: 30_000_00n, 2: 30_000_00n },
  }),
  tarjeta({
    id: 'guia',
    titulo: 'Guía de inicio en video',
    responsable: 2,
    valores: { 1: 20_000_00n, 2: 20_000_00n },
    eventos: [ev('terminada', '2026-11-10', 2), ev('objetada', '2026-11-14', 1)],
  }),
  tarjeta({
    id: 'mkt',
    responsable: 2,
    valores: { 1: 20_000_00n, 2: 20_000_00n },
    eventos: [ev('terminada', '2026-10-24', 2)],
  }),
];
const clausula = { numero: 'Décima segunda', texto: 'El socio que no cumpla…' };

describe('the incumplimiento notice (OD-4 §6, §8)', () => {
  const cerrado = resumenDelTrimestre({
    trimestre: '2026-T4',
    tarjetas,
    planes,
    hoy: '2027-01-09',
  });

  it('goes from the partner who cumplió to the one who did not, quoting the clause', () => {
    const a = avisoDelCierre(cerrado, clausula);
    assert.equal(a.de, 1);
    assert.equal(a.para, 2);
    assert.equal(a.comprometido, 70_000_00n);
    assert.equal(a.aceptado, 20_000_00n);
    assert.equal(a.porcentaje, 29);
    assert.deepEqual(
      a.noAceptadas.map((n) => [n.titulo, n.valor]),
      [
        ['Alianza con una distribuidora', 30_000_00n],
        ['Guía de inicio en video', 20_000_00n],
      ],
    );
  });

  it('reads in plain words, the clause word for word', () => {
    const t = textoDelAviso(avisoDelCierre(cerrado, clausula), { 1: 'Ana', 2: 'Beto' });
    assert.equal(t.titulo, 'Aviso de incumplimiento del 4T 2026');
    assert.match(
      t.cuerpo[0] ?? '',
      /aprobado por ambos el 3 de octubre de 2026, te comprometiste a entregables por \$70,000\.00/,
    );
    assert.match(t.cuerpo[0] ?? '', /se aceptaron \$20,000\.00, el 29 %/);
    assert.deepEqual(t.lista, [
      'Alianza con una distribuidora, $30,000.00: no se empezó.',
      'Guía de inicio en video, $20,000.00: objetada el 14 de noviembre de 2026, «Falta el video de inventario.» No se corrigió.',
    ]);
    assert.equal(t.cita, '«El socio que no cumpla…»');
    assert.equal(t.conforme, 'Conforme a la cláusula Décima segunda del acuerdo de socios:');
  });

  it('there is none before the close, without the clause, or when both fall short', () => {
    const abierto = resumenDelTrimestre({
      trimestre: '2026-T4',
      tarjetas,
      planes,
      hoy: '2026-12-01',
    });
    assert.throws(() => avisoDelCierre(abierto, clausula), codigo('AVISO_NO_APLICA'));
    assert.throws(() => avisoDelCierre(cerrado, null), codigo('AVISO_SIN_CLAUSULA'));
    const ambos = resumenDelTrimestre({
      trimestre: '2026-T4',
      tarjetas: tarjetas
        .filter((t) => t.id !== 'mkt')
        .map((t) => (t.id === 'lanz' ? { ...t, eventos: [] } : t)),
      planes,
      hoy: '2027-01-09',
    });
    assert.throws(() => avisoDelCierre(ambos, clausula), codigo('AVISO_NO_APLICA'));
  });

  it('is marked sent once, by the partner who sends it, on a day that already came', () => {
    const a = avisoDelCierre(cerrado, clausula);
    assertPuedeMarcarEnviado(a, {
      socio: 1,
      enviadoEl: '2027-01-09',
      hoy: '2027-01-09',
      yaEnviado: false,
    });
    assert.throws(
      () =>
        assertPuedeMarcarEnviado(a, {
          socio: 2,
          enviadoEl: '2027-01-09',
          hoy: '2027-01-09',
          yaEnviado: false,
        }),
      codigo('AVISO_EL_OTRO'),
    );
    assert.throws(
      () =>
        assertPuedeMarcarEnviado(a, {
          socio: 1,
          enviadoEl: '2027-01-10',
          hoy: '2027-01-09',
          yaEnviado: false,
        }),
      codigo('AVISO_FECHA'),
    );
    assert.throws(
      () =>
        assertPuedeMarcarEnviado(a, {
          socio: 1,
          enviadoEl: '2027-01-09',
          hoy: '2027-01-09',
          yaEnviado: true,
        }),
      codigo('AVISO_YA_ENVIADO'),
    );
  });

  it('the clause is kept as typed, number and text required', () => {
    assert.deepEqual(assertClausula({ numero: ' Décima segunda ', texto: ' Texto. ' }), {
      numero: 'Décima segunda',
      texto: 'Texto.',
    });
    assert.throws(() => assertClausula({ numero: '', texto: 'x' }), codigo('CLAUSULA_NUMERO'));
    assert.throws(() => assertClausula({ numero: 'x', texto: ' ' }), codigo('CLAUSULA_TEXTO'));
  });
});
