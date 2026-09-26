import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it } from 'vitest';

import {
  concurrentIndexNames,
  migrationProblems,
  NO_TRANSACTION,
  runsInTransaction,
} from '../scripts/hosted/lint';
import { MIGRATION_SETS } from '../scripts/hosted/plan';
import { splitStatements, withoutComments } from '../scripts/hosted/statements';

/**
 * DB2-MIG-01: the no-transaction half of `db:migrate:hosted`. A file marked
 * `-- xangarro:no-transaction` is split and sent one statement at a time,
 * so the splitter must never cut inside a string, an identifier, a comment
 * or a function body — a wrong cut sends half a statement to production.
 */
const REPO = resolve(import.meta.dirname, '../../..');

describe('splitStatements', () => {
  it('splits on top-level semicolons and drops the empty tail', () => {
    assert.deepEqual(splitStatements('SELECT 1;\nSELECT 2;\n'), ['SELECT 1', 'SELECT 2']);
    assert.deepEqual(splitStatements('SELECT 1'), ['SELECT 1']);
  });

  it('never cuts inside a string, a quoted identifier or an E-string escape', () => {
    assert.deepEqual(
      splitStatements(`SELECT 'a;b', 'it''s;'; SELECT "odd;name"; SELECT E'x\\';y'; SELECT 3`),
      [`SELECT 'a;b', 'it''s;'`, `SELECT "odd;name"`, `SELECT E'x\\';y'`, 'SELECT 3'],
    );
  });

  it('keeps a dollar-quoted body whole, tagged or not, and leaves $1 alone', () => {
    const fn = `CREATE FUNCTION f() RETURNS int LANGUAGE plpgsql AS $fn$
BEGIN PERFORM 1; RETURN $$;$$::text::int; END $fn$`;
    const parts = splitStatements(`${fn};\nDO $$ BEGIN PERFORM 2; END $$;\nSELECT $1`);
    assert.equal(parts.length, 3);
    assert.equal(parts[0], fn);
    assert.equal(parts[1], 'DO $$ BEGIN PERFORM 2; END $$');
    assert.equal(parts[2], 'SELECT $1');
  });

  it('ignores semicolons in line and nested block comments, and comment-only chunks', () => {
    const src = `-- a; b\nSELECT 1; /* x; /* nested; */ still; */ SELECT 2;\n-- tail; only\n`;
    const parts = splitStatements(src);
    assert.equal(parts.length, 2);
    assert.match(parts[0] ?? '', /SELECT 1$/);
    assert.match(parts[1] ?? '', /SELECT 2$/);
  });

  it('withoutComments keeps code and strings, and blanks every comment', () => {
    assert.equal(
      withoutComments(`SELECT '--no' -- yes\n/* gone */ , 1`).replace(/\s+/g, ' '),
      `SELECT '--no' , 1`,
    );
  });
});

describe('migration lint', () => {
  const noTx = (body: string) => `${NO_TRANSACTION}\nSET lock_timeout = '3s';\n${body}`;

  it('reads the marker only from the first line', () => {
    assert.equal(runsInTransaction('SELECT 1;'), true);
    assert.equal(runsInTransaction(`${NO_TRANSACTION}\nSELECT 1;`), false);
    assert.equal(runsInTransaction(`SELECT 1;\n${NO_TRANSACTION}`), true);
  });

  it('accepts a repeatable no-transaction file', () => {
    assert.deepEqual(
      migrationProblems(
        noTx(`CREATE INDEX CONCURRENTLY IF NOT EXISTS a ON t (x);
DROP INDEX CONCURRENTLY IF EXISTS b;
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS c ON t (y);`),
      ),
      [],
    );
  });

  it('refuses a no-transaction file without lock_timeout', () => {
    const problems = migrationProblems(
      `${NO_TRANSACTION}\nCREATE INDEX CONCURRENTLY IF NOT EXISTS a ON t (x);`,
    );
    assert.deepEqual(problems, ['runs outside a transaction without SET lock_timeout']);
  });

  it('refuses unrepeatable index statements and transaction control', () => {
    const problems = migrationProblems(
      noTx(`CREATE INDEX a ON t (x);
CREATE INDEX CONCURRENTLY b ON t (x);
DROP INDEX c;
BEGIN;
COMMIT;`),
    );
    assert.equal(problems.length, 5, problems.join('\n'));
  });

  it('refuses CONCURRENTLY in a transactional file, but not in its comments', () => {
    assert.equal(migrationProblems('CREATE INDEX CONCURRENTLY a ON t (x);').length, 1);
    assert.deepEqual(migrationProblems('-- runs concurrently\nSELECT 1;'), []);
  });

  it('names the indexes a file builds concurrently, as Postgres stores them', () => {
    assert.deepEqual(
      concurrentIndexNames(
        noTx(`CREATE INDEX CONCURRENTLY IF NOT EXISTS Sales_X ON sales (x);
CREATE UNIQUE INDEX CONCURRENTLY "Quoted" ON t (y);
DROP INDEX CONCURRENTLY IF EXISTS gone;`),
      ),
      ['sales_x', 'Quoted'],
    );
  });

  it('every migration in the repository passes', () => {
    for (const { dir } of MIGRATION_SETS) {
      for (const f of readdirSync(join(REPO, dir)).filter((n) => n.endsWith('.sql'))) {
        const problems = migrationProblems(readFileSync(join(REPO, dir, f), 'utf8'));
        assert.deepEqual(problems, [], `${dir}/${f}`);
      }
    }
  });

  it('every migration from DB2-MIG-01 on sets lock_timeout', () => {
    const since: Record<string, string> = {
      'packages/data-pg/drizzle': '0043',
      'apps/backoffice/src/server/db/migrations': '0020',
      'packages/data-pg/hosted': '9999',
    };
    for (const { dir } of MIGRATION_SETS) {
      const newer = readdirSync(join(REPO, dir)).filter(
        (n) => n.endsWith('.sql') && n >= (since[dir] ?? '9999'),
      );
      for (const f of newer) {
        const body = withoutComments(readFileSync(join(REPO, dir, f), 'utf8'));
        assert.match(body, /SET\s+(LOCAL\s+)?lock_timeout/i, `${dir}/${f} sets no lock_timeout`);
      }
    }
  });
});
