import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { measure, recall, type Measurement } from '../src/sensitivity/score';
import { seededBug } from '../src/seeded/bugs';
import { finding, run } from './aggregate-fixtures';

/**
 * S-13's recall (spec §9 `sensitivity.ts`): a seeded bug is detected when
 * the judge, on the run of the scenario it was aimed at, reported a finding
 * of the expected category whose key starts with the expected área/acción,
 * and the clean smoke did not already have it. A phone variant is measured
 * on its own run. A run that never finished is not measured, not missed.
 */
const VENTA = run({ persona: 'taquero', scenario: 'primera-venta' });
const TEL = run({ persona: 'taquero', scenario: 'primera-venta-telefono', runner: 'phone' });
const OTRA = run({ persona: 'lupita-abarrotes', scenario: 'onboarding-camino-a' });

const f = (r: typeof VENTA, category: string, key: string) =>
  finding({ run_id: r.id, category: category as never, dedupe_key: key });

describe('measure', () => {
  it('hits on the aimed run: right category, key under the prefix', () => {
    const bug = seededBug('cobrar-primer-clic');
    const [m] = measure(
      bug,
      [VENTA, OTRA],
      [f(VENTA, 'bug', 'caja/cobrar/no-responde-primer-clic')],
      [],
    );
    assert.deepEqual(
      { runner: m?.runner, hit: m?.hit, measured: m?.measured },
      { runner: 'web', hit: true, measured: true },
    );
  });

  it('misses when the finding was on another run, or in another category', () => {
    const bug = seededBug('cobrar-primer-clic');
    const elsewhere = [f(OTRA, 'bug', 'caja/cobrar/x'), f(VENTA, 'friction', 'caja/cobrar/y')];
    const [m] = measure(bug, [VENTA, OTRA], elsewhere, []);
    assert.equal(m?.hit, false);
    // The right key in the wrong category is a near miss, there to tune prompts.
    assert.deepEqual(m?.nearMisses, ['friction caja/cobrar/y']);
  });

  it('does not count what the clean smoke already found in that cell', () => {
    const bug = seededBug('total-redondeo');
    const same = f(VENTA, 'bug', 'caja/total/no-cuadra');
    const [m] = measure(
      bug,
      [VENTA],
      [same],
      [{ cell: 'taquero__primera-venta__task', category: 'bug', key: 'caja/total/no-cuadra' }],
    );
    assert.equal(m?.hit, false);
  });

  it('measures a phone variant on the phone run, apart from the web one', () => {
    const bug = seededBug('guardar-500');
    const ms = measure(bug, [VENTA, TEL], [f(TEL, 'bug', 'sincronizacion/enviar/no-envia')], []);
    assert.deepEqual(
      ms.map((m) => `${m.runner}:${String(m.hit)}`),
      ['web:false', 'phone:true'],
    );
  });

  it('leaves out a run that errored or never ran: not measured, not missed', () => {
    const bug = seededBug('cobrar-primer-clic');
    const broke = { ...VENTA, outcome: 'error' as const, success: null, error: 'Chromium' };
    assert.equal(measure(bug, [broke], [], [])[0]?.measured, false);
    assert.equal(measure(bug, [], [], [])[0]?.measured, false);
  });
});

describe('recall', () => {
  const m = (
    category: Measurement['category'],
    runner: Measurement['runner'],
    hit: boolean,
    measured = true,
  ): Measurement => ({
    bug: 'x',
    category,
    runner,
    hit,
    measured,
    finding: null,
    nearMisses: [],
  });

  it('is hits over what was measured, overall, by category and by runner', () => {
    const r = recall([
      m('bug', 'web', true),
      m('bug', 'web', false),
      m('friction', 'phone', true),
      m('comprehension', 'web', false, false),
    ]);
    assert.deepEqual(r.overall, { hits: 2, of: 3, recall: 2 / 3 });
    assert.deepEqual(r.byCategory.bug, { hits: 1, of: 2, recall: 0.5 });
    assert.deepEqual(r.byCategory.comprehension, { hits: 0, of: 0, recall: null });
    assert.deepEqual(r.byRunner.phone, { hits: 1, of: 1, recall: 1 });
  });
});
