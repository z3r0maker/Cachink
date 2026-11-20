import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  cellMetrics,
  comparablePrevious,
  findingDeltas,
  metricDeltas,
  runMetrics,
} from '../src/aggregate/metrics';
import { finding, run, steps } from './aggregate-fixtures';

/**
 * Spec §9: per persona × scenario, the outcome, real steps against
 * `optimal_steps`, where it was abandoned, console errors and agent failures
 * apart. Rates exist only as deltas against a comparable corrida.
 */
const OPTIMAL = new Map([['primera-venta', 8]]);

describe('runMetrics', () => {
  it('reads each run’s outcome, steps against optimal, console errors and agent failures', () => {
    const r = run({ persona: 'taquero', scenario: 'primera-venta', steps: steps(12) });
    const [m] = runMetrics(
      [{ run: r, consoleErrors: 2 }],
      [finding({ run_id: r.id, category: 'agent_failure' }), finding({ run_id: r.id })],
      OPTIMAL,
    );
    assert.equal(m?.steps, 12);
    assert.equal(m?.optimal_steps, 8);
    assert.equal(m?.abandon_step, null);
    assert.equal(m?.console_errors, 2);
    assert.equal(m?.agent_failures, 1);
  });

  it('marks the step an abandoned or blocked run stopped at', () => {
    const r = run({
      persona: 'taquero',
      scenario: 'primera-venta',
      outcome: 'abandoned',
      success: false,
      steps: steps(5),
    });
    assert.equal(runMetrics([{ run: r, consoleErrors: 0 }], [], OPTIMAL)[0]?.abandon_step, 5);
  });

  it('refuses a run whose scenario has no optimal_steps', () => {
    const r = run({ persona: 'taquero', scenario: 'otro' });
    assert.throws(() => runMetrics([{ run: r, consoleErrors: 0 }], [], OPTIMAL), /otro/);
  });
});

describe('metricDeltas', () => {
  const ok = run({ persona: 'taquero', scenario: 'primera-venta', steps: steps(10) });
  const failed = run({
    persona: 'taquero',
    scenario: 'primera-venta',
    repetition: 2,
    success: false,
    steps: steps(20),
  });
  const cells = (rs: ReturnType<typeof run>[]) =>
    cellMetrics(
      runMetrics(
        rs.map((r) => ({ run: r, consoleErrors: 0 })),
        [],
        OPTIMAL,
      ),
    );

  it('gives the success rate only as a change in points, with the mean steps’ change', () => {
    const [d] = metricDeltas(cells([ok]), cells([ok, failed]));
    assert.equal(d?.cell, 'taquero__primera-venta__task');
    assert.equal(d?.success_points, 50);
    assert.equal(d?.mean_steps, -5);
  });

  it('compares only the cells both corridas ran', () => {
    const other = run({ persona: 'lupita', scenario: 'primera-venta' });
    assert.deepEqual(metricDeltas(cells([other]), cells([ok])), []);
  });

  it('leaves out runs the harness failed: they say nothing about the app', () => {
    const broken = run({
      persona: 'taquero',
      scenario: 'primera-venta',
      repetition: 2,
      outcome: 'error',
      success: null,
      error: 'stack down',
    });
    assert.deepEqual(cells([ok, broken])[0]?.runs, 1);
  });
});

describe('findingDeltas', () => {
  it('names the keys that are new and the ones that no longer appear', () => {
    assert.deepEqual(findingDeltas(['a/b/c', 'a/b/d'], ['a/b/d', 'a/b/e']), {
      appeared: ['a/b/c'],
      gone: ['a/b/e'],
    });
  });
});

describe('comparablePrevious', () => {
  const me = { id: '20261121-aaaa', started_at: '2026-11-21T00:00:00.000Z', cells: ['t__p__task'] };

  it('picks the latest earlier corrida sharing a cell', () => {
    const found = comparablePrevious(me, [
      { id: '20261119-0001', started_at: '2026-11-19T00:00:00.000Z', cells: ['t__p__task'] },
      { id: '20261120-0002', started_at: '2026-11-20T00:00:00.000Z', cells: ['t__p__task'] },
      { id: '20261120-0003', started_at: '2026-11-20T05:00:00.000Z', cells: ['x__p__task'] },
    ]);
    assert.equal(found, '20261120-0002');
  });

  it('never picks itself or a later corrida, and finds none when nothing is comparable', () => {
    assert.equal(
      comparablePrevious(me, [
        me,
        { id: '20261122-0004', started_at: '2026-11-22T00:00:00.000Z', cells: ['t__p__task'] },
      ]),
      undefined,
    );
  });
});
