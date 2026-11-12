import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Sql } from 'postgres';
import { describe, it } from 'vitest';

import { ensureLedger } from '../scripts/hosted/ledger';

/**
 * E-44's lift-out carries the corp rows of the migration ledger to the new
 * database, so whoever runs the corp migrations there next starts at the right
 * file. `salida.sh` is bash and cannot call `ensureLedger`, so it keeps the
 * table's DDL in its own file; this holds the two to the same table.
 */
const REPO = resolve(import.meta.dirname, '../../..');
const SALIDA_LEDGER = resolve(REPO, 'packages/data-corp/scripts/salida/ledger.sql');

const normalize = (sql: string): string =>
  sql
    .split('\n')
    .map((line) => line.replace(/--.*$/, '').trim())
    .filter((line) => line !== '')
    .join(' ')
    .replace(/\s+/g, ' ');

async function ensureLedgerSql(): Promise<string> {
  let captured = '';
  const fake = { unsafe: async (sql: string) => void (captured = sql) } as unknown as Sql;
  await ensureLedger(fake);
  return captured;
}

describe("salida.sh's ledger table", () => {
  it('is the table db:migrate:hosted creates', async () => {
    assert.equal(
      normalize(readFileSync(SALIDA_LEDGER, 'utf8')),
      normalize(await ensureLedgerSql()),
    );
  });

  it('notices a column the runner has and the lift-out lacks', async () => {
    const runner = normalize(await ensureLedgerSql());
    assert.notEqual(
      normalize(readFileSync(SALIDA_LEDGER, 'utf8').replace(/,\s*applied_at[^\n]*/, '')),
      runner,
    );
  });

  it('ignores comments and indentation, not words', () => {
    assert.equal(
      normalize('-- a note\n  CREATE  TABLE x (\n a text\n);'),
      'CREATE TABLE x ( a text );',
    );
    assert.notEqual(normalize('CREATE TABLE x (a text);'), normalize('CREATE TABLE y (a text);'));
  });
});
