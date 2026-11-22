import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { corridaJobs } from '../src/corrida/jobs';
import { MatrixSchema } from '../src/schemas/matrix';
import { ScenarioSchema, type Scenario } from '../src/schemas/scenario';
import { PRIMERA_VENTA } from './fixtures';

/**
 * A matrix becomes the corrida's jobs (S-11): one per cell and repetition,
 * each knowing its runner, repetition rounds in order so a cut-short corrida
 * still covers every cell once.
 */
const web = ScenarioSchema.parse(PRIMERA_VENTA);
const phone = ScenarioSchema.parse({
  ...PRIMERA_VENTA,
  id: 'primera-venta-telefono',
  runner: 'phone',
  start: { ...PRIMERA_VENTA.start, url: '/' },
});
const scenarios = new Map<string, Scenario>([
  [web.id, web],
  [phone.id, phone],
]);

const matrix = (repetitions: number, style = 'task') =>
  MatrixSchema.parse({
    mode: 'smoke',
    repetitions,
    runs: [
      { persona: 'taquero', scenario: 'primera-venta', style },
      { persona: 'taquero', scenario: 'primera-venta-telefono', style: 'task' },
    ],
  });

describe('corridaJobs', () => {
  it('makes one job per cell and repetition, rounds in order, each with its runner', () => {
    const jobs = corridaJobs(matrix(2), scenarios);
    assert.deepEqual(
      jobs.map((j) => `${j.scenario}#${j.repetition}@${j.runner}`),
      [
        'primera-venta#1@web',
        'primera-venta-telefono#1@phone',
        'primera-venta#2@web',
        'primera-venta-telefono#2@phone',
      ],
    );
    assert.equal(jobs[0]?.persona, 'taquero');
    assert.equal(jobs[0]?.style, 'task');
  });

  it('refuses a walkthrough cell: that style comes with S-14', () => {
    assert.throws(() => corridaJobs(matrix(1, 'walkthrough'), scenarios), /walkthrough.*S-14/);
  });

  it('refuses a cell whose scenario is not in the catalogue', () => {
    assert.throws(() => corridaJobs(matrix(1), new Map([[web.id, web]])), /primera-venta-telefono/);
  });

  it('caps a corrida at the runs it may hold, rather than start a matrix it cannot finish', () => {
    assert.throws(() => corridaJobs(matrix(2), scenarios, 3), /4 runs.*at most 3/);
    assert.equal(corridaJobs(matrix(2), scenarios, 4).length, 4);
  });
});
