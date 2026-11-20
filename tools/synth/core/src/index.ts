/**
 * The harness core of Xangarro Synth (ADR-153): the schemas of every file it
 * reads and writes, and the checker for its YAML (S-03). Nothing under
 * `apps/*` or `packages/*` may import this package: ESLint refuses it, and
 * `scripts/lint-boundaries.test.ts` proves the rule fires.
 */
export { evidenceFile, type PersonaKind } from './schemas/common';
export { ConfigSchema, LOCAL_HOSTS, type Config } from './schemas/config';
export { FindingSchema, hasEvidence, RUN_ID, type Finding } from './schemas/finding';
export { jsonSchemaText, SCHEMAS, type SchemaName } from './schemas/json';
export { MatrixSchema, type Matrix, type MatrixRun } from './schemas/matrix';
export { evidenceShare, GROUNDED_SHARE, PersonaSchema, type Persona } from './schemas/persona';
export { RunSchema, runId, type Run } from './schemas/run';
export { ScenarioSchema, type Scenario } from './schemas/scenario';
export { formatIssue, validateTree, type SourceFile, type TreeIssue } from './validate/tree';
