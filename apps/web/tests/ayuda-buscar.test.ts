import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { buscar, cuantos } from '../src/app/(portal)/ayuda/buscar';
import { TEMAS } from '../src/app/(portal)/ayuda/contenido';
import { GUIAS } from '../src/app/(portal)/ayuda/guias';

describe('Ayuda: finding an answer (ADR-107)', () => {
  it('finds a question by its other names, accents aside', () => {
    const h = buscar('VINCULAR telefono');
    assert.deepEqual(
      h.preguntas.map((p) => p.q),
      ['¿Cómo conecto la caja de quien cobra?'],
    );
  });

  it('finds guides by their steps too', () => {
    assert.ok(buscar('código').guias.some((g) => g.id === 'conecta-caja'));
  });

  it('narrows to a topic, and lists everything with no words', () => {
    const plan = buscar('', 'plan');
    assert.ok(plan.preguntas.length > 0 && plan.preguntas.every((p) => p.tema === 'plan'));
    assert.equal(buscar('').guias.length, GUIAS.length);
  });

  it('finds nothing for nonsense', () => {
    const h = buscar('zzzz');
    assert.equal(h.preguntas.length + h.guias.length, 0);
  });

  it('never shows an empty topic', () => {
    for (const t of TEMAS) assert.ok(cuantos(t.id) > 0, t.label);
  });

  it('only links to the portal’s own screens', () => {
    const hrefs = [
      ...buscar('').preguntas.flatMap((p) => (p.ir ? [p.ir.href] : [])),
      ...GUIAS.map((g) => g.ir.href),
    ];
    for (const h of hrefs) assert.match(h, /^\/[a-z-]/);
  });
});
