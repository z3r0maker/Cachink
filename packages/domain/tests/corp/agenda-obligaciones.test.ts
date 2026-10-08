import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  assertTransicion,
  CATALOGO,
  estaCumplida,
  EvidenciaFaltanteError,
  instanciasEsperadas,
  plantilla,
  siguientesPasos,
  TransicionInvalidaError,
  vencimiento,
  type Plantilla,
  type TipoEvidencia,
} from '../../src/corp/index.js';

/** E-04: when each obligation is due, which exist, and what moves them. */
const p = (id: string): Plantilla => {
  const found = plantilla(id);
  if (found === undefined) throw new Error(id);
  return found;
};

describe('vencimiento', () => {
  it('moves a 17th that falls on a Saturday to Monday', () => {
    assert.deepEqual(vencimiento(p('isr_mensual').regla, '2026-09'), {
      nominal: '2026-10-17',
      vence: '2026-10-19',
    });
  });

  it('keeps a 17th that is a business day, and crosses the year', () => {
    assert.equal(vencimiento(p('iva_mensual').regla, '2026-10').vence, '2026-11-17');
    assert.equal(vencimiento(p('iva_mensual').regla, '2026-12').vence, '2027-01-18');
  });

  it('dates the annual filings in March of the next year', () => {
    assert.equal(vencimiento(p('declaracion_anual').regla, '2026').vence, '2027-03-31');
    // «Durante marzo»: a Sunday 31 moves back, to Friday 29.
    assert.equal(vencimiento(p('informe_sas').regla, '2023').vence, '2024-03-29');
  });

  it('counts 15 business days after a share event, and keeps an expiry date', () => {
    assert.equal(
      vencimiento(p('beneficiario_controlador').regla, '2026-10-02').vence,
      '2026-10-23',
    );
    assert.equal(vencimiento(p('csd').regla, '2026-11-18').vence, '2026-11-18');
  });

  it('reads a day past the month end as its last day', () => {
    assert.equal(vencimiento(p('diot').regla, '2027-01').nominal, '2027-02-28');
  });
});

describe('instanciasEsperadas', () => {
  const lista = instanciasEsperadas(CATALOGO, '2026-09-04', '2026-11-30');

  it('starts with the month of the SAT registration and stops at the horizon', () => {
    const isr = lista.filter((i) => i.plantillaId === 'isr_mensual').map((i) => i.periodo);
    assert.deepEqual(isr, ['2026-09', '2026-10']);
  });

  it('creates nothing for an exempt template, nor for one-off ones', () => {
    const ids = new Set(lista.map((i) => i.plantillaId));
    for (const id of ['diot', 'contabilidad_electronica', 'csd', 'beneficiario_controlador']) {
      assert.equal(ids.has(id), false, id);
    }
  });

  it('orders by due date', () => {
    const fechas = lista.map((i) => i.vence);
    assert.deepEqual(fechas, [...fechas].sort());
  });

  it('has nothing before the registration', () => {
    assert.deepEqual(instanciasEsperadas(CATALOGO, '2026-09-04', '2026-09-01'), []);
  });
});

describe('the steps', () => {
  const con = (...kinds: TipoEvidencia[]) => new Set(kinds);
  const isr = p('isr_mensual');

  it('lets a declaration be prepared, or filed straight away', () => {
    assert.deepEqual(siguientesPasos(isr, 'pendiente'), ['preparada', 'presentada']);
    assert.deepEqual(siguientesPasos(isr, 'presentada'), ['pagada']);
    assert.deepEqual(siguientesPasos(isr, 'pagada'), []);
    assert.equal(estaCumplida(isr, 'pagada'), true);
  });

  it('marks it presentada only with its acuse, and pagada only with the proof', () => {
    assert.doesNotThrow(() =>
      assertTransicion(isr, { actual: 'preparada', nuevo: 'presentada', evidencias: con('acuse') }),
    );
    assert.throws(
      () => assertTransicion(isr, { actual: 'preparada', nuevo: 'presentada', evidencias: con() }),
      EvidenciaFaltanteError,
    );
    assert.throws(
      () =>
        assertTransicion(isr, { actual: 'presentada', nuevo: 'pagada', evidencias: con('acuse') }),
      /comprobante de pago/,
    );
  });

  it('closes a declaration with nothing to pay without a payment proof', () => {
    assert.doesNotThrow(() =>
      assertTransicion(isr, {
        actual: 'presentada',
        nuevo: 'pagada',
        evidencias: con('acuse'),
        sinPago: true,
      }),
    );
  });

  it('never skips the filing, and never goes back', () => {
    assert.throws(
      () =>
        assertTransicion(isr, {
          actual: 'pendiente',
          nuevo: 'pagada',
          evidencias: con('acuse', 'comprobante_pago'),
        }),
      TransicionInvalidaError,
    );
    assert.throws(
      () => assertTransicion(isr, { actual: 'presentada', nuevo: 'preparada', evidencias: con() }),
      TransicionInvalidaError,
    );
  });

  it('asks the 32-D opinion for the SAT PDF', () => {
    assert.throws(
      () =>
        assertTransicion(p('opinion_32d'), {
          actual: 'pendiente',
          nuevo: 'presentada',
          evidencias: con('acuse'),
        }),
      /opinión del SAT/,
    );
  });
});

describe('CATALOGO', () => {
  it('gives every exempt template its reason and review month', () => {
    const exentas = CATALOGO.filter((t) => t.exenta !== null);
    assert.deepEqual(
      exentas.map((t) => t.id),
      ['diot', 'contabilidad_electronica'],
    );
    for (const t of exentas) assert.match(t.exenta?.revisar ?? '', /^\d{4}-\d{2}$/);
  });

  it('names evidence for every step that needs one', () => {
    for (const t of CATALOGO) assert.ok(t.evidencia.presentada !== undefined, t.id);
  });
});
