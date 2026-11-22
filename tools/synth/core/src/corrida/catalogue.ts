import { parse } from 'yaml';

import { existsUnder, readTree } from '../cli/read-tree';
import { ConfigSchema, type Config } from '../schemas/config';
import { MatrixSchema, type Matrix } from '../schemas/matrix';
import { PersonaSchema, type Persona } from '../schemas/persona';
import { ScenarioSchema, type Scenario } from '../schemas/scenario';
import { formatIssue, validateTree } from '../validate/tree';

/**
 * `tools/synth/` as the commands use it: validated first, so nothing runs on a
 * tree `validate` would refuse, then parsed. Each persona and scenario keeps
 * its YAML text too, since the judge reads them as written.
 */
export interface Entry<T> {
  readonly value: T;
  readonly text: string;
}

export interface Catalogue {
  readonly config: Config;
  readonly personas: ReadonlyMap<string, Entry<Persona>>;
  readonly scenarios: ReadonlyMap<string, Entry<Scenario>>;
  /** By file name: `smoke` is `matrix/smoke.yaml`. */
  readonly matrices: ReadonlyMap<string, Matrix>;
}

const base = (path: string): string => path.replace(/^.*\//, '').replace(/\.ya?ml$/, '');

export function loadCatalogue(synthDir: string): Catalogue {
  const files = readTree(synthDir);
  const issues = validateTree(files, existsUnder(synthDir));
  if (issues.length > 0) {
    throw new Error(`tools/synth/ is not valid:\n${issues.map(formatIssue).join('\n')}`);
  }
  const personas = new Map<string, Entry<Persona>>();
  const scenarios = new Map<string, Entry<Scenario>>();
  const matrices = new Map<string, Matrix>();
  let config: Config | undefined;
  for (const f of files) {
    const doc: unknown = parse(f.text);
    if (f.path === 'config.yaml') config = ConfigSchema.parse(doc);
    else if (f.path.startsWith('personas/')) {
      const value = PersonaSchema.parse(doc);
      personas.set(value.id, { value, text: f.text });
    } else if (f.path.startsWith('scenarios/')) {
      const value = ScenarioSchema.parse(doc);
      scenarios.set(value.id, { value, text: f.text });
    } else if (f.path.startsWith('matrix/')) matrices.set(base(f.path), MatrixSchema.parse(doc));
  }
  if (config === undefined) throw new Error('tools/synth/config.yaml is missing');
  return { config, personas, scenarios, matrices };
}

/** A persona or scenario by id, or an error naming what is missing. */
export function entry<T>(map: ReadonlyMap<string, Entry<T>>, kind: string, id: string): Entry<T> {
  const e = map.get(id);
  if (e === undefined) throw new Error(`no ${kind} «${id}»`);
  return e;
}
