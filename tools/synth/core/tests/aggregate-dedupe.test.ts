import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { groupFindings } from '../src/aggregate/dedupe';
import { finding, PERSONAS, run } from './aggregate-fixtures';

/**
 * Spec §9 `aggregate.ts`: evidence-less findings are dropped, the rest are
 * deduplicated by `dedupe_key`, prioritised by severity × distinct personas ×
 * their summed market weight, and counted across repetitions.
 */
const TAQ1 = run({ persona: 'taquero', scenario: 'primera-venta' });
const TAQ2 = run({ persona: 'taquero', scenario: 'primera-venta', repetition: 2 });
const TAQ3 = run({ persona: 'taquero', scenario: 'primera-venta', repetition: 3 });
const LUP = run({ persona: 'lupita', scenario: 'primera-venta' });
const NONE = { steps: [], screenshots: [], console: [], network: [] };

describe('groupFindings', () => {
  it('merges findings with one dedupe_key across runs and personas', () => {
    const { groups } = groupFindings(
      [finding({ run_id: TAQ1.id }), finding({ run_id: LUP.id, severity: 'major' })],
      [TAQ1, LUP],
      PERSONAS,
    );
    assert.equal(groups.length, 1);
    const g = groups[0];
    assert.deepEqual(g?.personas, ['lupita', 'taquero']);
    assert.equal(g?.severity, 'major');
    assert.equal(g?.findingIds.length, 2);
    // major (2) × 2 personas × (0.5 + 0.3)
    assert.equal(g?.priority, 3.2);
  });

  it('drops a finding with no evidence, and says which', () => {
    const bare = finding({ run_id: TAQ1.id, evidence: NONE });
    const { groups, droppedNoEvidence } = groupFindings([bare], [TAQ1], PERSONAS);
    assert.deepEqual(groups, []);
    assert.deepEqual(droppedNoEvidence, [bare.id]);
  });

  it('keeps one key in two categories apart, so agent_failure never joins a real finding', () => {
    const { groups } = groupFindings(
      [finding({ run_id: TAQ1.id }), finding({ run_id: TAQ2.id, category: 'agent_failure' })],
      [TAQ1, TAQ2],
      PERSONAS,
    );
    assert.deepEqual(groups.map((g) => g.category).sort(), ['agent_failure', 'friction']);
  });

  it('counts the repetitions a finding appeared in, out of its cells’ runs', () => {
    const { groups } = groupFindings(
      [finding({ run_id: TAQ1.id }), finding({ run_id: TAQ3.id })],
      [TAQ1, TAQ2, TAQ3, LUP],
      PERSONAS,
    );
    assert.deepEqual(groups[0]?.seenIn, { runs: 2, of: 3 });
  });

  it('is grounded only when every persona it reached is, and orders by priority', () => {
    const { groups } = groupFindings(
      [
        finding({ run_id: TAQ1.id, dedupe_key: 'caja/a/x' }),
        finding({ run_id: LUP.id, dedupe_key: 'caja/b/y', severity: 'critical' }),
        finding({ run_id: TAQ1.id, dedupe_key: 'caja/b/y' }),
      ],
      [TAQ1, LUP],
      PERSONAS,
    );
    assert.deepEqual(
      groups.map((g) => [g.key, g.personaStatus]),
      [
        ['caja/b/y', 'hypothesis'],
        ['caja/a/x', 'hypothesis'],
      ],
    );
    const lupOnly = groupFindings([finding({ run_id: LUP.id })], [LUP], PERSONAS).groups[0];
    assert.equal(lupOnly?.personaStatus, 'grounded');
  });

  it('refuses a finding whose run or persona the corrida does not have', () => {
    assert.throws(
      () => groupFindings([finding({ run_id: 'x__y__task__r1' })], [TAQ1], PERSONAS),
      /x__y__task__r1/,
    );
  });
});
