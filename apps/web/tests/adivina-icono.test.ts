import assert from 'node:assert/strict';
import { ProductIconEnum } from '@xangarro/domain';
import { describe, it } from 'vitest';

import { adivinaIcono, SUGERIDOS } from '../src/lib/adivina-icono';

describe('adivinaIcono — the icon a new product starts with (ADR-107)', () => {
  it('reads the name, accents and case aside', () => {
    assert.equal(adivinaIcono('Taco de suadero'), 'sandwich');
    assert.equal(adivinaIcono('AGUA DE JAMAICA'), 'glass-water');
    assert.equal(adivinaIcono('Café de olla'), 'coffee');
    assert.equal(adivinaIcono('Refresco 600 ml'), 'cup-soda');
    assert.equal(adivinaIcono('Corte de cabello'), 'scissors');
    assert.equal(adivinaIcono('Pastel de tres leches'), 'cake');
    // «uña» without its tilde is «una»: an article must never pick the icon.
    assert.equal(adivinaIcono('Una torta ahogada'), 'sandwich');
  });

  it('prefers the first word that matches, so «Pan de muerto» is bread-ish, not candy', () => {
    assert.equal(adivinaIcono('Pan de muerto'), 'croissant');
  });

  it('matches whole words, so «cerveza» is not read inside «cervezería» only by accident', () => {
    assert.equal(adivinaIcono('Cerveza oscura'), 'beer');
    assert.equal(adivinaIcono('Tamarindo'), 'package');
  });

  it('falls back to a box for anything it does not know, or an empty name', () => {
    assert.equal(adivinaIcono('Xyz 123'), 'package');
    assert.equal(adivinaIcono('   '), 'package');
  });

  it('only ever answers with icons the phone knows', () => {
    for (const icon of SUGERIDOS.map((s) => s.icon)) {
      assert.ok(ProductIconEnum.options.includes(icon), icon);
    }
    assert.equal(new Set(SUGERIDOS.map((s) => s.icon)).size, SUGERIDOS.length);
  });
});
