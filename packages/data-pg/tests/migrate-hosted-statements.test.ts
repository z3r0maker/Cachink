import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it } from 'vitest';

import {
  concurrentIndexNames,
  lockTimeoutMs,
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
    assert.deepEqual(problems, ['must SET lock_timeout as its first statement']);
  });

  it('refuses a no-transaction file that sets lock_timeout late (R2-11)', () => {
    // Everything before the SET would run under whatever the session had.
    const problems = migrationProblems(
      `${NO_TRANSACTION}\nALTER POLICY p ON t USING (true);\nSET lock_timeout = '200ms';\n`,
    );
    assert.ok(
      problems.includes('must SET lock_timeout as its first statement'),
      problems.join('\n'),
    );
  });

  it('refuses SET LOCAL outside a transaction, where it does nothing', () => {
    const problems = migrationProblems(
      `${NO_TRANSACTION}\nSET LOCAL lock_timeout = '200ms';\nSELECT 1;`,
    );
    assert.ok(
      problems.some((p) => /SET LOCAL/.test(p)),
      problems.join('\n'),
    );
  });

  it('refuses unrepeatable index statements and transaction control', () => {
    const problems = migrationProblems(
      noTx(`CREATE INDEX a ON t (x);
CREATE INDEX CONCURRENTLY b ON t (x);
DROP INDEX c;
BEGIN;
COMMIT;
ABORT;
ROLLBACK;`),
    );
    assert.equal(problems.length, 7, problems.join('\n'));
  });

  it('refuses a REINDEX that is not CONCURRENTLY, in either kind of file (R2-11)', () => {
    assert.equal(migrationProblems(noTx('REINDEX INDEX a;')).length, 1);
    assert.equal(migrationProblems('REINDEX TABLE t;').length, 1);
    assert.deepEqual(migrationProblems(noTx('REINDEX INDEX CONCURRENTLY a;')), []);
  });

  it('lets concurrent builds wait forever, but not an ACCESS EXCLUSIVE statement', () => {
    const forever = `${NO_TRANSACTION}\nSET lock_timeout = 0;\n`;
    assert.deepEqual(
      migrationProblems(`${forever}CREATE INDEX CONCURRENTLY IF NOT EXISTS a ON t (x);
DROP INDEX CONCURRENTLY IF EXISTS b;
ALTER TABLE public.t SET (fillfactor = 80, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE t RESET (fillfactor);`),
      [],
      'these take SHARE UPDATE EXCLUSIVE at most: waiting blocks nobody',
    );
    for (const stmt of [
      'ALTER POLICY p ON t USING (true);',
      'ALTER TABLE t ADD COLUMN c int;',
      'ALTER TABLE t SET (fillfactor = 80), ADD COLUMN c int;',
      'DROP TABLE t;',
      'LOCK TABLE t;',
      'CREATE TRIGGER g AFTER INSERT ON t FOR EACH ROW EXECUTE FUNCTION f();',
    ]) {
      const problems = migrationProblems(forever + stmt);
      assert.equal(problems.length, 1, `${stmt} → ${problems.join('; ')}`);
      assert.match(problems[0] ?? '', /ACCESS EXCLUSIVE/);
    }
  });

  it('accepts an ACCESS EXCLUSIVE statement under a short timeout, refuses 3 s', () => {
    const at = (t: string) =>
      migrationProblems(
        `${NO_TRANSACTION}\nSET lock_timeout = ${t};\nALTER POLICY p ON t USING (true);`,
      );
    assert.deepEqual(at(`'200ms'`), []);
    assert.deepEqual(at('250'), [], 'a bare number is milliseconds');
    assert.equal(at(`'3s'`).length, 1, 'the 3 s that stalled readers in DB3-MIG-01');
    // Switching down before the exclusive part of a file is fine.
    assert.deepEqual(
      migrationProblems(`${NO_TRANSACTION}\nSET lock_timeout = 0;
CREATE INDEX CONCURRENTLY IF NOT EXISTS a ON t (x);
SET lock_timeout TO '150ms';
ALTER POLICY p ON t USING (true);`),
      [],
    );
  });

  it('holds a transactional file to SET LOCAL, so nothing leaks onto the session (R2-13)', () => {
    assert.equal(migrationProblems(`SET lock_timeout = '200ms';\nSELECT 1;`).length, 1);
    assert.deepEqual(
      migrationProblems(`SET LOCAL lock_timeout = '200ms';\nALTER TABLE t ADD c int;`),
      [],
    );
    assert.equal(
      migrationProblems(`SET LOCAL lock_timeout = '3s';\nALTER TABLE t ADD c int;`).length,
      1,
      'a transactional file that chooses a timeout must choose a short one',
    );
    assert.deepEqual(
      migrationProblems('ALTER TABLE t ADD c int;'),
      [],
      'older files run under the runner default',
    );
  });

  it('reads lock_timeout values the way Postgres does', () => {
    assert.equal(lockTimeoutMs('0'), 0);
    assert.equal(lockTimeoutMs("'0'"), 0);
    assert.equal(lockTimeoutMs('200'), 200);
    assert.equal(lockTimeoutMs("'200ms'"), 200);
    assert.equal(lockTimeoutMs("'3s'"), 3000);
    assert.equal(lockTimeoutMs("'10min'"), 600_000);
    assert.equal(lockTimeoutMs("'1h'"), 3_600_000);
    assert.equal(lockTimeoutMs("'2 s'"), 2000);
    assert.equal(lockTimeoutMs('DEFAULT'), null);
    assert.equal(lockTimeoutMs("'soon'"), null);
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
      [
        { schema: 'public', name: 'sales_x' },
        { schema: 'public', name: 'Quoted' },
      ],
    );
    assert.deepEqual(
      concurrentIndexNames(
        noTx(`CREATE INDEX CONCURRENTLY IF NOT EXISTS s_idx ON xangarro.portal_sessions (x);
CREATE INDEX CONCURRENTLY IF NOT EXISTS o_idx ON ONLY "Odd"."T" (x) WHERE x IS NOT NULL;`),
      ),
      [
        { schema: 'xangarro', name: 's_idx' },
        { schema: 'Odd', name: 'o_idx' },
      ],
      'the table’s schema is the index’s (R2-12)',
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
        const raw = readFileSync(join(REPO, dir, f), 'utf8');
        const body = withoutComments(raw);
        const want = runsInTransaction(raw) ? /SET\s+LOCAL\s+lock_timeout/i : /SET\s+lock_timeout/i;
        assert.match(body, want, `${dir}/${f} sets no lock_timeout of its kind`);
      }
    }
  });
});
