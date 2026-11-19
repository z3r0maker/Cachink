import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, it } from 'vitest';

import { jsonSchemaText, SCHEMAS, type SchemaName } from '../src/schemas/json';

/**
 * `tools/synth/schemas/*.json` is generated from the zod schemas. Like
 * DESIGN_CONTRACT.md, a stale copy is a bug, so this fails until
 * `pnpm --filter @xangarro/synth-core schemas` is rerun.
 */
const DIR = resolve(import.meta.dirname, '../../schemas');
const NAMES = Object.keys(SCHEMAS) as SchemaName[];

describe('generated JSON Schemas', () => {
  it('has one file per schema, and nothing else', () => {
    assert.ok(existsSync(DIR), 'run `pnpm --filter @xangarro/synth-core schemas`');
    assert.deepEqual(readdirSync(DIR).sort(), NAMES.map((n) => `${n}.schema.json`).sort());
  });

  it('every file matches what the zod schema generates today', () => {
    const stale = NAMES.filter(
      (n) => readFileSync(join(DIR, `${n}.schema.json`), 'utf8') !== jsonSchemaText(n),
    );
    assert.deepEqual(stale, [], 'stale; run `pnpm --filter @xangarro/synth-core schemas`');
  });

  it('closes every object, so an unknown key is refused by editors too', () => {
    const persona = JSON.parse(jsonSchemaText('persona')) as { additionalProperties?: boolean };
    assert.equal(persona.additionalProperties, false);
  });
});
