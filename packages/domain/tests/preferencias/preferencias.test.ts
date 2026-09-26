import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  atributoClave,
  METODOS_CONFIGURABLES,
  parseAtributos,
  parseMetodosPago,
  validateAtributos,
  validateMetodosPago,
} from '../../src/index.js';

describe('tipos de pago', () => {
  it('keeps the chosen methods in catalogue order, as the JSON the phones read', () => {
    const r = validateMetodosPago(['Tarjeta', 'Efectivo']);
    assert.deepEqual(r, { ok: true, value: '["Efectivo","Tarjeta"]' });
  });

  it('refuses turning every method off', () => {
    assert.equal(validateMetodosPago([]).ok, false);
  });

  it('refuses a method outside the configurable set (Crédito is a Función)', () => {
    assert.equal(validateMetodosPago(['Efectivo', 'Crédito']).ok, false);
    assert.equal(validateMetodosPago(['Cheque']).ok, false);
  });

  it('reads the stored JSON, falling back to every offered method on junk', () => {
    assert.deepEqual(parseMetodosPago('["Transferencia"]'), ['Transferencia']);
    assert.deepEqual(parseMetodosPago('no-json'), [...METODOS_CONFIGURABLES]);
    assert.deepEqual(parseMetodosPago(null), [...METODOS_CONFIGURABLES]);
    // A row the wizard wrote before P-36 carries «Crédito»; that is the Función, not a method here.
    assert.deepEqual(parseMetodosPago('["Efectivo","Crédito"]'), ['Efectivo']);
    assert.deepEqual(parseMetodosPago('["Crédito"]'), [...METODOS_CONFIGURABLES]);
  });
});

describe('QR/CoDi is retired from every picker (ADR-108)', () => {
  it('is not a configurable method', () => {
    assert.deepEqual([...METODOS_CONFIGURABLES], ['Efectivo', 'Transferencia', 'Tarjeta']);
  });

  it('cannot be switched on from the portal', () => {
    assert.equal(validateMetodosPago(['Efectivo', 'QR/CoDi']).ok, false);
  });

  it('is dropped from a business that stored it before the retirement', () => {
    const stored = '["Efectivo","Transferencia","Tarjeta","QR/CoDi"]';
    assert.deepEqual(parseMetodosPago(stored), ['Efectivo', 'Transferencia', 'Tarjeta']);
  });

  it('a list that held only QR/CoDi falls back to every offered method', () => {
    assert.deepEqual(parseMetodosPago('["QR/CoDi"]'), [...METODOS_CONFIGURABLES]);
  });
});

describe('atributos de producto', () => {
  it('derives a stable key from the label, accents and spaces included', () => {
    assert.equal(atributoClave('Tamaño de porción'), 'tamano_de_porcion');
    assert.equal(atributoClave('  Color  '), 'color');
    assert.equal(atributoClave('2 sabores'), '_2_sabores');
  });

  it('a row with options is a list; without, free text', () => {
    const r = validateAtributos([
      { label: 'Talla', opciones: ['Chica', ' Grande ', ''], obligatorio: true },
      { label: 'Notas', opciones: [], obligatorio: false },
    ]);
    assert.equal(r.ok, true);
    assert.deepEqual(r.ok && r.value, [
      {
        clave: 'talla',
        label: 'Talla',
        tipo: 'select',
        opciones: ['Chica', 'Grande'],
        obligatorio: true,
      },
      { clave: 'notas', label: 'Notas', tipo: 'texto', obligatorio: false },
    ]);
  });

  it('refuses a blank name, pointing at its row', () => {
    const r = validateAtributos([
      { label: 'Talla', opciones: [], obligatorio: false },
      { label: ' ', opciones: [], obligatorio: false },
    ]);
    assert.deepEqual(r, { ok: false, errors: { 1: 'Escribe el nombre del atributo.' } });
  });

  it('refuses two rows that would share a key', () => {
    const r = validateAtributos([
      { label: 'Color', opciones: [], obligatorio: false },
      { label: 'color ', opciones: [], obligatorio: false },
    ]);
    assert.deepEqual(r, { ok: false, errors: { 1: 'Ya tienes un atributo con ese nombre.' } });
  });

  it('refuses a name longer than 60 characters', () => {
    const r = validateAtributos([{ label: 'x'.repeat(61), opciones: [], obligatorio: false }]);
    assert.equal(r.ok, false);
  });

  it('reads the stored JSON, dropping what does not parse', () => {
    assert.deepEqual(
      parseAtributos(
        '[{"clave":"talla","label":"Talla","tipo":"texto","obligatorio":false},{"x":1}]',
      ),
      [{ clave: 'talla', label: 'Talla', tipo: 'texto', obligatorio: false }],
    );
    assert.deepEqual(parseAtributos('nope'), []);
  });
});
