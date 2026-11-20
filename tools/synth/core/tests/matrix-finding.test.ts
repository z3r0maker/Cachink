import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { FindingSchema, hasEvidence } from '../src/schemas/finding';
import { MatrixSchema } from '../src/schemas/matrix';
import { failingPaths, issues, withPatch } from './helpers';

const SMOKE = {
  mode: 'smoke',
  repetitions: 1,
  runs: [
    { persona: 'lupita-abarrotes', scenario: 'onboarding-camino-a', style: 'task' },
    { persona: 'taquero', scenario: 'primera-venta', style: 'task' },
    { persona: 'lupita-abarrotes', scenario: 'primera-venta', style: 'walkthrough' },
  ],
} as const;

describe('MatrixSchema', () => {
  it('accepts the spec’s smoke matrix', () => {
    assert.deepEqual(issues(MatrixSchema, SMOKE), []);
  });

  it('refuses the same persona, scenario and style twice: repetitions say how many', () => {
    const dup = withPatch(SMOKE, { runs: [...SMOKE.runs, SMOKE.runs[1]] });
    const [issue] = issues(MatrixSchema, dup);
    assert.match(issue ?? '', /^runs\.3: .*taquero__primera-venta__task/);
  });

  it('refuses an empty matrix and zero repetitions', () => {
    assert.deepEqual(
      failingPaths(MatrixSchema, withPatch(SMOKE, { runs: [], repetitions: 0 })).sort(),
      ['repetitions', 'runs'],
    );
  });

  it('refuses a style or mode outside the lists', () => {
    const bad = withPatch(SMOKE, {
      mode: 'nightly',
      runs: [{ persona: 'taquero', scenario: 'primera-venta', style: 'exploratory' }],
    });
    assert.deepEqual(failingPaths(MatrixSchema, bad).sort(), ['mode', 'runs.0.style']);
  });
});

const FINDING = {
  id: 'F-2026-11-19-007',
  run_id: 'lupita-abarrotes__primera-venta__task__r1',
  category: 'friction',
  severity: 'major',
  title: 'El botón Cobrar queda oculto bajo el teclado en 360px',
  description: 'Con el teclado abierto, Cobrar queda fuera de la pantalla.',
  evidence: { steps: [14, 15], screenshots: ['runs/x/step-015.png'], console: [], network: [] },
  persona_status: 'hypothesis',
  repro: 'Abrir caja en 360px, tocar la cantidad, buscar Cobrar.',
  confidence: 'high',
  dedupe_key: 'caja/cobrar/boton-oculto-teclado',
} as const;

describe('FindingSchema', () => {
  it('accepts the spec’s finding', () => {
    assert.deepEqual(issues(FindingSchema, FINDING), []);
    assert.equal(hasEvidence(FINDING), true);
  });

  it('a finding with no reference at all is valid in shape, and hasEvidence says to drop it', () => {
    const bare = withPatch(FINDING, {
      evidence: { steps: [], screenshots: [], console: [], network: [] },
    });
    assert.deepEqual(issues(FindingSchema, bare), []);
    assert.equal(hasEvidence(FindingSchema.parse(bare)), false);
  });

  it('refuses an id, run id or dedupe key off their patterns', () => {
    const bad = withPatch(FINDING, {
      id: 'F-7',
      run_id: 'lupita-abarrotes-primera-venta',
      dedupe_key: 'Caja Cobrar',
    });
    assert.deepEqual(failingPaths(FindingSchema, bad).sort(), ['dedupe_key', 'id', 'run_id']);
  });

  it('refuses a category, severity or confidence outside the lists', () => {
    const bad = withPatch(FINDING, {
      category: 'nice_to_have',
      severity: 'blocker',
      confidence: 'certain',
    });
    assert.deepEqual(failingPaths(FindingSchema, bad).sort(), [
      'category',
      'confidence',
      'severity',
    ]);
  });

  it('refuses step numbers that are not positive integers', () => {
    const bad = withPatch(FINDING, { evidence: { ...FINDING.evidence, steps: [0, 2.5] } });
    assert.deepEqual(failingPaths(FindingSchema, bad).sort(), [
      'evidence.steps.0',
      'evidence.steps.1',
    ]);
  });
});
