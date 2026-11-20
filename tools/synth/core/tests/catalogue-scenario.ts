import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import { parse } from 'yaml';

import { readTree } from '../src/cli/read-tree';
import { PersonaSchema, type Persona } from '../src/schemas/persona';
import { ScenarioSchema, type Scenario } from '../src/schemas/scenario';

/** The personas and scenarios on disk under `tools/synth/`, parsed, for the tests about the catalogue. */
export const SYNTH = resolve(import.meta.dirname, '../..');
export const tree = readTree(SYNTH);

export const personas = new Map<string, Persona>(
  tree
    .filter((f) => f.path.startsWith('personas/'))
    .map((f) => PersonaSchema.parse(parse(f.text)))
    .map((p) => [p.id, p]),
);

export const scenarios = new Map<string, Scenario>(
  tree
    .filter((f) => f.path.startsWith('scenarios/'))
    .map((f) => ScenarioSchema.parse(parse(f.text)))
    .map((s) => [s.id, s]),
);

export function catalogueScenario(id: string): Scenario {
  const s = scenarios.get(id);
  assert.ok(s, `no scenario «${id}»`);
  return s;
}
