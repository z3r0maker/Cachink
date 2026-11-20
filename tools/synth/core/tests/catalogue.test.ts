import assert from 'node:assert/strict';

import { PLAN_LIMITS } from '@xangarro/domain';
import { describe, it } from 'vitest';

import { existsUnder } from '../src/cli/read-tree';
import { FIXTURES } from '../src/seed/fixtures';
import { formatIssue, validateTree } from '../src/validate/tree';
import { catalogueScenario as scenario, personas, SYNTH, tree } from './catalogue-scenario';

/**
 * S-10's catalogue, as it is on disk: the v1 personas and scenarios, valid,
 * with owner decision 12's weights and the two permission cases the plan names.
 */

describe('the v1 catalogue', () => {
  it('validates clean, as `validate` checks it', () => {
    assert.deepEqual(validateTree(tree, existsUnder(SYNTH)).map(formatIssue), []);
  });

  it('has the four v1 personas, all hypotheses, at decision 12’s weights', () => {
    const weights = Object.fromEntries(
      ['lupita-abarrotes', 'taquero', 'operador', 'chaos'].map((id) => {
        const p = personas.get(id);
        assert.ok(p, `no persona «${id}»`);
        assert.equal(p.status, 'hypothesis', id);
        assert.equal(p.market_weight.source, 'estimate', id);
        return [id, p.market_weight.value];
      }),
    );
    // chaos is not a segment: it inherits the humans' weight at aggregation.
    assert.deepEqual(weights, { 'lupita-abarrotes': 0.3, taquero: 0.25, operador: 0.1, chaos: 0 });
    assert.equal(personas.get('chaos')?.kind, 'chaos');
  });

  it('has the v1 scenarios, primera-venta on the web and on the phone', () => {
    for (const id of [
      'onboarding-camino-a',
      'primera-venta',
      'primera-venta-telefono',
      'corte-de-caja',
      'permisos-operador',
      'permisos-operador-xangarrote',
    ]) {
      scenario(id);
    }
    assert.equal(scenario('primera-venta').runner, 'web');
    assert.equal(scenario('primera-venta-telefono').runner, 'phone');
  });

  it('onboarding-camino-a starts with no account, at signup, and ends with all eight steps answered', () => {
    const s = scenario('onboarding-camino-a');
    assert.equal(s.start.seed, 'sin-cuenta');
    assert.equal(s.start.url, '/signup');
    assert.deepEqual(s.success, [{ check: 'onboarding-terminado', params: { pasos: 8 } }]);
  });

  it('permisos-operador refuses a cancel on xangarro, where the operator was never allowed', () => {
    const plan = FIXTURES[scenario('permisos-operador').start.seed];
    assert.equal(plan.plan, 'xangarro');
    assert.equal(PLAN_LIMITS.xangarro.capabilities.permisosPorUsuario, false);
    assert.equal(plan.operators[0]?.canCancelSales, false);
  });

  it('permisos-operador-xangarrote refuses it where the owner turned the permission off', () => {
    const plan = FIXTURES[scenario('permisos-operador-xangarrote').start.seed];
    assert.equal(plan.plan, 'xangarrote');
    assert.equal(PLAN_LIMITS.xangarrote.capabilities.permisosPorUsuario, true);
    assert.equal(plan.operators[0]?.canCancelSales, false);
  });
});
