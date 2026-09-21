import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { luminanciaRelativa, monograma, tintaSobre } from '../../src/comprobante/index.js';
import {
  envolver,
  fechaLarga,
  fechaNumerica,
  hora,
  pesos,
} from '../../src/comprobante/svg/comun.js';

describe('contraste (N-20: the 0.45 rule)', () => {
  it('puts the yellow above the threshold and the green below', () => {
    assert.ok(luminanciaRelativa('#FFD60A') > 0.45);
    assert.ok(luminanciaRelativa('#14532D') < 0.45);
  });

  it("flips the ink exactly at the fichas' examples", () => {
    assert.equal(tintaSobre('#FFD60A'), '#0D0D0D');
    assert.equal(tintaSobre('#14532D'), '#FFFFFF');
    assert.equal(tintaSobre('#FFFFFF'), '#0D0D0D');
    assert.equal(tintaSobre('#0D0D0D'), '#FFFFFF');
  });

  it('accepts the short #RGB form', () => {
    assert.equal(tintaSobre('#FF0'), '#0D0D0D');
  });

  it('refuses colours that are not hex', () => {
    assert.throws(() => luminanciaRelativa('amarillo'));
  });
});

describe('monograma (N-20: two letters, deterministically)', () => {
  it('takes the first two significant words', () => {
    assert.equal(monograma('Plomería Lozano'), 'PL');
    assert.equal(monograma('Taquería Doña Cuca'), 'TD');
  });

  it('skips connectors so «y» never makes the cut', () => {
    assert.equal(monograma('Abarrotes y Cremería La Michoacana'), 'AC');
    assert.equal(monograma('Tortas del Don'), 'TD');
  });

  it('one word yields its first two letters; blank never crashes', () => {
    assert.equal(monograma('SURTIDORA'), 'SU');
    assert.equal(monograma('   '), 'XG');
  });
});

describe('envolver (N-20: character-count wrapping)', () => {
  it('keeps text that fits on one line, untouched', () => {
    assert.deepEqual(envolver('Refresco 600 ml', 30, 2), ['Refresco 600 ml']);
  });

  it('wraps at spaces and never mid-word while it can', () => {
    assert.deepEqual(envolver('Orden de tacos al pastor', 12, 2), ['Orden de', 'tacos al…']);
  });

  it('slices a single word longer than the line', () => {
    assert.deepEqual(envolver('Superextraordinario', 10, 1), ['Superextr…']);
  });

  it('no ellipsis when everything fit', () => {
    const lineas = envolver('Queso Cotija por kilo crema', 14, 3);
    assert.deepEqual(lineas, ['Queso Cotija', 'por kilo crema']);
  });
});

describe('formatos es-MX (N-20)', () => {
  it('money renders as the artboards print it', () => {
    assert.equal(pesos(28500n), '$285.00');
    assert.equal(pesos(125000n), '$1,250.00');
  });

  it('long date keeps the short month lowercase', () => {
    assert.equal(fechaLarga('2026-09-14T20:32:00Z'), '14 sep 2026');
  });

  it('hour is Mexico City whatever the host thinks', () => {
    assert.equal(hora('2026-09-14T20:32:00Z'), '14:32');
  });

  it('Ticket stamps numerically', () => {
    assert.equal(fechaNumerica('2026-09-14T20:32:00Z'), '14/09/2026 14:32');
  });
});
