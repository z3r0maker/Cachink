import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { jsonSchemaText, SCHEMAS, type SchemaName } from '../schemas/json';

/**
 * `pnpm --filter @xangarro/synth-core schemas`: writes
 * `tools/synth/schemas/<name>.schema.json` from the zod schemas. Generated,
 * never hand-edited: `tests/schemas-json.test.ts` fails when a file is stale.
 */
const DIR = resolve(import.meta.dirname, '../../../schemas');

mkdirSync(DIR, { recursive: true });
for (const name of Object.keys(SCHEMAS) as SchemaName[]) {
  writeFileSync(join(DIR, `${name}.schema.json`), jsonSchemaText(name));
}
process.stdout.write(`wrote ${Object.keys(SCHEMAS).length} schemas to tools/synth/schemas/\n`);
