import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { agendaDe } from '@xangarro/application/corp';
import { CATALOGO } from '@xangarro/domain/corp';

import {
  etiquetaEstado,
  falta,
  grupos,
  itemDe,
  recorrido,
} from '../src/server/empresa/agenda-view';

/** E-04's Próximos in the board's words. */
const vistas = (guardadas: Parameters<typeof agendaDe>[0]['guardadas'] = []) =>
  agendaDe({ catalogo: CATALOGO, inscripcion: '2026-08-03', guardadas, hasta: '2026-12-31' });

describe('grupos', () => {
  it('splits open obligations into late, the next two weeks and later', () => {
    const g = grupos(vistas(), '2026-10-08');
    assert.deepEqual(
      g.map((x) => x.label),
      ['Vencidas', 'Esta semana y la siguiente', 'Más adelante'],
    );
    const late = g[0]?.items.map((i) => i.key) ?? [];
    assert.ok(late.includes('isr_mensual~2026-08'));
    assert.ok(g[1]?.items.some((i) => i.key === 'isr_mensual~2026-09'));
  });

  it('leaves out what is done', () => {
    const g = grupos(
      vistas([
        {
          id: 'o',
          plantillaId: 'isr_mensual',
          periodo: '2026-08',
          titulo: null,
          estado: 'pagada',
          sinPago: false,
        },
      ]),
      '2026-10-08',
    );
    assert.equal(
      g.flatMap((x) => x.items).some((i) => i.key === 'isr_mensual~2026-08'),
      false,
    );
  });

  it('shows monthly periods only up to 60 days ahead', () => {
    const later = grupos(vistas(), '2026-10-08').flatMap((x) => x.items);
    assert.equal(
      later.some((i) => i.key === 'isr_mensual~2026-11'),
      false,
    ); // due 17 Dec, 70 days
    assert.ok(later.some((i) => i.key === 'isr_mensual~2026-10')); // due 17 Nov, 40 days
  });

  it('has no groups when nothing is open', () => {
    assert.deepEqual(grupos([], '2026-10-08'), []);
  });
});

describe('the words', () => {
  it('says how long is left, or how late', () => {
    assert.equal(falta('2026-10-15', '2026-10-08'), 'en 7 días');
    assert.equal(falta('2026-10-08', '2026-10-08'), 'vence hoy');
    assert.equal(falta('2026-09-30', '2026-10-08'), 'vencida hace 8 días');
  });

  it('explains a moved deadline', () => {
    assert.equal(
      recorrido('2026-10-17', '2026-10-19'),
      'El 17 cae en sábado, así que se recorre al lunes 19.',
    );
    assert.equal(
      recorrido('2024-03-31', '2024-03-29'),
      'El 31 cae en domingo, así que se adelanta al viernes 29.',
    );
    assert.equal(recorrido('2026-11-17', '2026-11-17'), null);
  });

  it('names a review by what it is, and a declaration with nothing to pay', () => {
    const p = CATALOGO.find((t) => t.id === 'buzon');
    const isr = CATALOGO.find((t) => t.id === 'isr_mensual');
    assert.equal(p && etiquetaEstado(p, 'presentada', false), 'Revisada');
    assert.equal(isr && etiquetaEstado(isr, 'pagada', true), 'Sin pago');
  });

  it('marks a late pending item in red', () => {
    const late = vistas().find((o) => o.periodo === '2026-08' && o.plantilla.id === 'buzon');
    assert.equal(late && itemDe(late, '2026-10-08').tono, 'bad');
  });
});
