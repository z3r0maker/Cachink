import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { AYUDA, GUIAS, PANTALLAS_CAJA, buscar, buscarEn } from '../src/index.js';

const caja = GUIAS.filter((g) => g.superficie === 'caja');
const pantallas: ReadonlySet<string> = new Set(PANTALLAS_CAJA);
const palabras = (texto: string) => texto.trim().split(/\s+/).length;

describe('the eight guides of whoever charges (G-03, ADR-163)', () => {
  it('are these eight, in the order a first day goes', () => {
    assert.deepEqual(
      caja.map((g) => g.id),
      [
        'abrir-turno',
        'cobrar-venta',
        'cobrar-escaner',
        'registrar-gasto',
        'llego-mercancia',
        'alta-producto',
        'cancelar-venta',
        'cerrar-turno',
      ],
    );
  });

  it('take four steps at most, each short enough to read at the counter', () => {
    for (const g of caja) {
      assert.ok(g.pasos.length >= 2 && g.pasos.length <= 4, g.id);
      for (const p of g.pasos) assert.ok(p.texto.length <= 80, `${g.id}: «${p.texto}»`);
    }
  });

  it('give Don Cuentas a line to say at every step, of twelve words or fewer', () => {
    for (const g of caja) {
      for (const p of g.pasos) {
        assert.ok(p.voz !== undefined && p.voz.trim().length > 0, `${g.id}: «${p.texto}»`);
        assert.ok(palabras(p.voz) <= 12, `${g.id}: «${p.voz}»`);
      }
    }
  });

  it('write what he says to be spoken: no digits, no peso sign, no quotation marks', () => {
    for (const g of caja) {
      for (const p of g.pasos) assert.doesNotMatch(p.voz ?? '', /[0-9$«»"]/, `${g.id}: «${p.voz}»`);
    }
  });

  it('belong to screens the caja has, and end on one of them', () => {
    for (const g of caja) {
      assert.ok(g.pantallas.length > 0, g.id);
      for (const p of [g.ir.href, ...g.pantallas]) assert.ok(pantallas.has(p), `${g.id}: ${p}`);
    }
  });

  it('name the control of a step, when they do, only once per guide', () => {
    for (const g of caja) {
      const controles = g.pasos.flatMap((p) => (p.control === undefined ? [] : [p.control]));
      assert.equal(new Set(controles).size, controles.length, g.id);
    }
  });

  it('stay out of the portal’s search, and answer the caja’s', () => {
    assert.ok(buscar('cobrar').guias.every((g) => g.superficie === 'portal'));
    const h = buscarEn(AYUDA, 'cobrar', { superficie: 'caja' });
    assert.ok(h.guias.some((g) => g.id === 'cobrar-venta'));
    assert.deepEqual(h.preguntas, []);
  });

  it('are found without the accent the title carries', () => {
    const ids = buscarEn(AYUDA, 'mercancia', { superficie: 'caja' }).guias.map((g) => g.id);
    assert.ok(ids.includes('llego-mercancia'));
  });

  it('keep the scanner guide off the browser, where the caja has no scanner', () => {
    const ids = (dispositivo: 'telefono' | 'web') =>
      buscarEn(AYUDA, '', { superficie: 'caja', dispositivo }).guias.map((g) => g.id);
    assert.equal(ids('telefono').length, 8);
    assert.equal(ids('web').length, 7);
    assert.ok(!ids('web').includes('cobrar-escaner'));
    assert.equal(
      buscarEn(AYUDA, 'escaner', { superficie: 'caja', dispositivo: 'web' }).guias.length,
      0,
    );
  });

  it('find nothing in the caja for a word no guide has', () => {
    assert.equal(buscarEn(AYUDA, 'factura', { superficie: 'caja' }).guias.length, 0);
  });
});
