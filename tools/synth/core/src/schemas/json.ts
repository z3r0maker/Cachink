import { z } from 'zod';

import { ConfigSchema } from './config';
import { CorridaSchema } from './corrida';
import { FindingSchema } from './finding';
import { MatrixSchema } from './matrix';
import { PersonaSchema } from './persona';
import { RunSchema } from './run';
import { ScenarioSchema } from './scenario';

/**
 * The JSON Schema of each file the harness reads or writes (spec §5's
 * `schemas/*.json`), generated from the zod schemas, which are the one source.
 * They exist for editors (a YAML language server can point at them) and for
 * anything outside TypeScript. The cross-field rules (60% evidence to be
 * grounded, an id built from its parts) live only in zod and `validate.ts`;
 * JSON Schema cannot say them, so a file can pass its JSON Schema and still
 * fail `pnpm --filter @xangarro/synth-core validate`.
 */
export const SCHEMAS = {
  config: ConfigSchema,
  corrida: CorridaSchema,
  finding: FindingSchema,
  matrix: MatrixSchema,
  persona: PersonaSchema,
  run: RunSchema,
  scenario: ScenarioSchema,
} as const;

export type SchemaName = keyof typeof SCHEMAS;

/** `tools/synth/schemas/<name>.schema.json`, as text, exactly as the generator writes it. */
export function jsonSchemaText(name: SchemaName): string {
  const schema = z.toJSONSchema(SCHEMAS[name], { io: 'input' });
  return `${JSON.stringify({ title: `Synth ${name}`, ...schema }, null, 2)}\n`;
}
