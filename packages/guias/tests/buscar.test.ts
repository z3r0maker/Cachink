import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  GUIAS,
  TEMAS,
  buscar,
  buscarEn,
  cuantos,
  type Fuente,
  type Guia,
  type Superficie,
} from '../src/index.js';

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

  it('finds the same with the accent, without it and in capitals', () => {
    const ids = (texto: string) => buscar(texto).guias.map((g) => g.id);
    assert.ok(ids('código').length > 0);
    assert.deepEqual(ids('codigo'), ids('código'));
    assert.deepEqual(ids('CÓDIGO'), ids('código'));
  });

  it('lists everything for an empty search, and narrows to a topic', () => {
    const plan = buscar('', 'plan');
    assert.ok(plan.preguntas.length > 0 && plan.preguntas.every((p) => p.tema === 'plan'));
    assert.equal(buscar('').guias.length, GUIAS.filter((g) => g.superficie === 'portal').length);
    assert.equal(buscar('   ').guias.length, buscar('').guias.length);
  });

  it('finds nothing for a word no guide and no answer has', () => {
    const h = buscar('zzzz');
    assert.equal(h.preguntas.length + h.guias.length, 0);
  });

  it('needs every word of the search, not just one', () => {
    assert.ok(buscar('código').guias.length > 0);
    assert.equal(buscar('código zzzz').guias.length, 0);
  });

  it('never shows an empty topic', () => {
    for (const t of TEMAS) assert.ok(cuantos(t.id) > 0, t.label);
  });
});

const guia = (
  id: string,
  superficie: Superficie,
  titulo: string,
  pasos: readonly string[],
): Guia => ({
  id,
  superficie,
  tema: 'ventas',
  titulo,
  minutos: 1,
  pasos: pasos.map((texto) => ({ texto })),
  ir: { label: 'Ir', href: '/x' },
  pantallas: [],
  publica: false,
});

const FUENTE: Fuente = {
  preguntas: [{ tema: 'ventas', q: '¿Cómo cobro?', a: 'Con la caja.', tambien: ['vender'] }],
  guias: [
    guia('cobrar', 'caja', 'Cobrar una venta', ['Toca lo que pidió el cliente.', 'Toca Cobrar.']),
    guia('producto', 'portal', 'Agrega un producto', ['Entra a Productos.', 'Toca Guardar.']),
  ],
};

describe('one search for every surface (ADR-163)', () => {
  it('gives the caja its own guides and none of the portal’s', () => {
    const h = buscarEn(FUENTE, '', { superficie: 'caja' });
    assert.deepEqual(
      h.guias.map((g) => g.id),
      ['cobrar'],
    );
  });

  it('keeps the owner’s answers out of the caja', () => {
    assert.deepEqual(buscarEn(FUENTE, 'vender', { superficie: 'caja' }).preguntas, []);
    assert.equal(buscarEn(FUENTE, 'vender', { superficie: 'portal' }).preguntas.length, 1);
  });

  it('gives the portal its guides and not the caja’s', () => {
    const h = buscarEn(FUENTE, 'toca', { superficie: 'portal' });
    assert.deepEqual(
      h.guias.map((g) => g.id),
      ['producto'],
    );
  });

  it('searches every surface when none is named', () => {
    assert.equal(buscarEn(FUENTE, 'toca').guias.length, 2);
  });

  it('finds nothing in a source with nothing in it', () => {
    const h = buscarEn({ preguntas: [], guias: [] }, 'cobrar');
    assert.equal(h.preguntas.length + h.guias.length, 0);
  });

  it('narrows by topic and by surface at once', () => {
    assert.equal(buscarEn(FUENTE, '', { tema: 'plan', superficie: 'portal' }).guias.length, 0);
    assert.equal(buscarEn(FUENTE, '', { tema: 'ventas', superficie: 'portal' }).guias.length, 1);
  });
});
