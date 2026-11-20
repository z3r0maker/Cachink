import { parseDocument } from 'yaml';
import type { z } from 'zod';

import { evidenceFile } from '../schemas/common';
import { ConfigSchema } from '../schemas/config';
import { MatrixSchema, type Matrix } from '../schemas/matrix';
import { PersonaSchema, type Persona } from '../schemas/persona';
import { ScenarioSchema, type Scenario } from '../schemas/scenario';
import { matrixIssues } from './cross';

/**
 * Checks the harness's YAML (S-03): every file against its schema, then what
 * no single schema can see, ids against file names, evidence files on disk
 * and the matrices' references. It reads nothing: the CLI hands it the files,
 * with paths relative to `tools/synth/`, and an `exists` for evidence files.
 */
export interface SourceFile {
  readonly path: string;
  readonly text: string;
}

export interface TreeIssue {
  readonly file: string;
  /** The field path, `line N` for a syntax error, or `(file)` for the file itself. */
  readonly at: string;
  readonly reason: string;
}

export const formatIssue = (i: TreeIssue): string => `${i.file}: ${i.at}: ${i.reason}`;

type Kind = 'config' | 'persona' | 'scenario' | 'matrix';

const KINDS: readonly (readonly [Kind, RegExp])[] = [
  ['config', /^config\.ya?ml$/],
  ['persona', /^personas\/(?!evidence\/).+\.ya?ml$/],
  ['scenario', /^scenarios\/[^/]+\.ya?ml$/],
  ['matrix', /^matrix\/[^/]+\.ya?ml$/],
];

const SCHEMAS: Readonly<Record<Kind, z.ZodType>> = {
  config: ConfigSchema,
  persona: PersonaSchema,
  scenario: ScenarioSchema,
  matrix: MatrixSchema,
};

const kindOf = (path: string): Kind | undefined => KINDS.find(([, re]) => re.test(path))?.[0];
const baseName = (path: string): string => path.replace(/^.*\//, '').replace(/\.ya?ml$/, '');

/** The parsed and schema-checked value, or the issues that stopped it. */
function load(file: SourceFile, kind: Kind): { value?: unknown; issues: TreeIssue[] } {
  const doc = parseDocument(file.text);
  const [error] = doc.errors;
  if (error !== undefined) {
    const line = error.linePos?.[0].line ?? 1;
    const first = error.message.split('\n')[0] ?? error.code;
    const reason = first.replace(/ at line \d+, column \d+:?$/, '');
    return { issues: [{ file: file.path, at: `line ${line}`, reason }] };
  }
  const parsed = SCHEMAS[kind].safeParse(doc.toJS());
  if (parsed.success) return { value: parsed.data, issues: [] };
  const issues = parsed.error.issues.map((i) => ({
    file: file.path,
    at: i.path.join('.') || '(root)',
    reason: i.message,
  }));
  return { issues };
}

export interface Loaded {
  readonly personas: Map<string, { readonly file: string; readonly value: Persona }>;
  readonly scenarios: Map<string, { readonly file: string; readonly value: Scenario }>;
  readonly matrices: { readonly file: string; readonly value: Matrix }[];
  /**
   * `persona:<name>` and `scenario:<name>` for files that exist but failed:
   * already reported once, so a matrix pointing at them is not told they are
   * missing.
   */
  readonly broken: Set<string>;
}

/** Ids must name their file, and a persona id is taken once across every folder. */
function idIssues(file: string, id: string, taken: string | undefined): TreeIssue[] {
  const out: TreeIssue[] = [];
  if (id !== baseName(file)) {
    out.push({ file, at: 'id', reason: `«${id}» must match the file name «${baseName(file)}»` });
  }
  if (taken !== undefined) out.push({ file, at: 'id', reason: `«${id}» is also ${taken}` });
  return out;
}

function evidenceIssues(file: string, p: Persona, exists: (path: string) => boolean): TreeIssue[] {
  return p.behaviors.flatMap((b, i) => {
    const path = evidenceFile(b.source);
    if (path === null || exists(path)) return [];
    return [{ file, at: `behaviors.${i}.source`, reason: `${path} does not exist` }];
  });
}

/** Files it knows, in order, filed by kind once they pass their schema. */
function register(
  file: SourceFile,
  kind: Kind,
  value: unknown,
  into: Loaded,
  exists: (path: string) => boolean,
): TreeIssue[] {
  if (kind === 'persona') {
    const p = value as Persona;
    const out = [
      ...idIssues(file.path, p.id, into.personas.get(p.id)?.file),
      ...evidenceIssues(file.path, p, exists),
    ];
    if (!into.personas.has(p.id)) into.personas.set(p.id, { file: file.path, value: p });
    return out;
  }
  if (kind === 'scenario') {
    const s = value as Scenario;
    const out = idIssues(file.path, s.id, into.scenarios.get(s.id)?.file);
    if (!into.scenarios.has(s.id)) into.scenarios.set(s.id, { file: file.path, value: s });
    return out;
  }
  if (kind === 'matrix') into.matrices.push({ file: file.path, value: value as Matrix });
  return [];
}

export function validateTree(
  files: readonly SourceFile[],
  exists: (path: string) => boolean,
): TreeIssue[] {
  const issues: TreeIssue[] = [];
  if (!files.some((f) => kindOf(f.path) === 'config')) {
    issues.push({ file: 'config.yaml', at: '(file)', reason: 'missing' });
  }
  const loaded: Loaded = {
    personas: new Map(),
    scenarios: new Map(),
    matrices: [],
    broken: new Set(),
  };
  for (const file of files) {
    const kind = kindOf(file.path);
    if (kind === undefined) {
      issues.push({
        file: file.path,
        at: '(file)',
        reason: 'not a config, persona, scenario or matrix file',
      });
      continue;
    }
    const { value, issues: found } = load(file, kind);
    issues.push(...found);
    if (value !== undefined) issues.push(...register(file, kind, value, loaded, exists));
    else loaded.broken.add(`${kind}:${baseName(file.path)}`);
  }
  return [...issues, ...matrixIssues(loaded)];
}
