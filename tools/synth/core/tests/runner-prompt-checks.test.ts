import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { PersonaSchema } from '../src/schemas/persona';
import { renderActorPrompt } from '../src/runner/prompt';
import { CHECK_NAMES, checkParams } from '../src/success/checks';
import { LUPITA } from './fixtures';

const TEMPLATE = 'Quién: {{persona}}\nTienes: {{access}}\nMáximo {{max_steps}} acciones.';
const persona = PersonaSchema.parse(LUPITA);

describe('renderActorPrompt', () => {
  const out = renderActorPrompt(TEMPLATE, persona, ['Ya entraste a la caja como Ana.'], 25);

  it('fills every placeholder', () => {
    assert.doesNotMatch(out, /\{\{/);
    assert.match(out, /Máximo 25 acciones/);
    assert.match(out, /Ya entraste a la caja como Ana\./);
  });

  it('tells the persona what it does not understand, what it wants and when it gives up', () => {
    assert.match(out, /No entiendes: SKU, inventario, conciliación/);
    assert.match(out, /Quieres: saber cuánto vendió hoy/);
    assert.match(out, /Te rindes si: le piden un dato que no tiene a la mano \(RFC\)/);
    assert.match(out, /lee solo los botones grandes/);
  });

  it('leaks nothing the persona would not know about itself: no id, status, weight or sources', () => {
    for (const leak of [
      'lupita-abarrotes',
      'hypothesis',
      'grounded',
      '0.3',
      'evidence/',
      'estimate',
    ]) {
      assert.ok(!out.includes(leak), leak);
    }
  });

  it('refuses a template with a placeholder it does not fill', () => {
    assert.throws(() => renderActorPrompt('{{persona}} {{clima}}', persona, [], 10), /clima/);
  });
});

describe('success checks', () => {
  it('names venta-efectivo, the check primera-venta uses', () => {
    assert.ok(CHECK_NAMES.includes('venta-efectivo'));
  });

  it('venta-efectivo takes a positive whole number of lines', () => {
    assert.deepEqual(checkParams('venta-efectivo', { partidas: 2 }), { partidas: 2 });
    for (const params of [
      {},
      { partidas: 0 },
      { partidas: 1.5 },
      { partidas: '2' },
      { partidas: 2, extra: 1 },
    ]) {
      assert.throws(
        () => checkParams('venta-efectivo', params),
        /venta-efectivo/,
        JSON.stringify(params),
      );
    }
  });

  it('refuses a check that does not exist', () => {
    assert.throws(
      () => checkParams('venta-con-tarjeta', {}),
      /no success check «venta-con-tarjeta»/,
    );
  });
});
