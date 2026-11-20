import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { evidenceShare, PersonaSchema } from '../src/schemas/persona';
import { LUPITA } from './fixtures';
import { failingPaths, issues, withPatch } from './helpers';

describe('PersonaSchema', () => {
  it('accepts the spec’s persona', () => {
    assert.deepEqual(issues(PersonaSchema, LUPITA), []);
  });

  it('requires every behavior to name its source: an evidence file or «hypothesis»', () => {
    const noSource = withPatch(LUPITA, { behaviors: [{ trait: 'cobra rápido' }] });
    assert.deepEqual(failingPaths(PersonaSchema, noSource), ['behaviors.0.source']);
    for (const source of ['blog/post.md', 'evidence/../secretos.md', 'Hypothesis', '']) {
      const bad = withPatch(LUPITA, { behaviors: [{ trait: 'x', source }] });
      assert.deepEqual(failingPaths(PersonaSchema, bad), ['behaviors.0.source'], source);
    }
  });

  it('refuses «grounded» below 60% of behaviors citing evidence', () => {
    const half = withPatch(LUPITA, { status: 'grounded' });
    const [issue] = issues(PersonaSchema, half);
    assert.match(issue ?? '', /^status: .*60%/);
  });

  it('takes «grounded» at exactly 60%', () => {
    const ev = (n: number) => ({ trait: `t${n}`, source: `evidence/r.md#L${n}` });
    const behaviors = [
      ev(1),
      ev(2),
      ev(3),
      { trait: 'h1', source: 'hypothesis' },
      { trait: 'h2', source: 'hypothesis' },
    ];
    assert.equal(evidenceShare(behaviors), 0.6);
    assert.deepEqual(
      issues(PersonaSchema, withPatch(LUPITA, { status: 'grounded', behaviors })),
      [],
    );
  });

  it('refuses enums outside the lists, a weight outside 0–1 and an id that is not kebab-case', () => {
    const bad = withPatch(LUPITA, {
      id: 'Lupita_Abarrotes',
      kind: 'robot',
      market_weight: { value: 1.4, source: 'estimate' },
    });
    assert.deepEqual(failingPaths(PersonaSchema, bad).sort(), [
      'id',
      'kind',
      'market_weight.value',
    ]);
  });

  it('refuses an empty goal list, a non-integer viewport and zero patience', () => {
    const bad = withPatch(LUPITA, {
      goals: [],
      device: { viewport: [360.5, 740], network: 'slow-3g', input: 'touch' },
      patience: { max_steps: 0, abandon_triggers: [] },
    });
    assert.deepEqual(failingPaths(PersonaSchema, bad).sort(), [
      'device.viewport.0',
      'goals',
      'patience.max_steps',
    ]);
  });

  it('refuses keys the model does not know, so a typo is not silently ignored', () => {
    assert.deepEqual(failingPaths(PersonaSchema, withPatch(LUPITA, { biografia: 'nació en…' })), [
      '',
    ]);
  });
});
