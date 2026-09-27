import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { applyMigration, ensureLedger, readApplied } from '../scripts/hosted/ledger';
import { runsInTransaction } from '../scripts/hosted/lint';
import { checksum, type MigrationFile } from '../scripts/hosted/plan';
import { isLockTimeout, type RetryPolicy } from '../scripts/hosted/retry';
import { integrationSuite } from './support/db';
import { createScratchDb, type ScratchDb } from './support/scratch-db';

/**
 * DB3-MIG-01 against a real held lock: an ACCESS EXCLUSIVE statement waits
 * only a moment for its table, so readers never queue behind it for long, and
 * the runner retries it with backoff — the statement alone in a
 * no-transaction file, the whole transaction otherwise — until the table is
 * free. On a throwaway database, through `applyMigration` itself.
 */
const { describe } = integrationSuite();

const file = (name: string, body: string): MigrationFile => ({
  name: `data-pg/${name}`,
  path: name,
  body,
  checksum: checksum(body),
  transactional: runsInTransaction(body),
});

const fast = (seen: number[], attempts = 30): RetryPolicy => ({
  attempts,
  baseMs: 40,
  maxMs: 160,
  onRetry: (n) => seen.push(n),
});

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

describe('the hosted runner retries lock timeouts', () => {
  let db: ScratchDb;
  let sql: postgres.Sql;
  let other: postgres.Sql;
  let reader: postgres.Sql;

  /** A reader holds ACCESS SHARE on retry_probe until `release()`. */
  async function holdProbe(): Promise<{ release: () => void; done: Promise<unknown> }> {
    let release = () => undefined as void;
    const gate = new Promise<void>((r) => (release = r));
    let taken = () => undefined as void;
    const locked = new Promise<void>((r) => (taken = r));
    const done = other.begin(async (tx) => {
      await tx`LOCK TABLE public.retry_probe IN ACCESS SHARE MODE`;
      taken();
      await gate;
    });
    await locked;
    return { release, done };
  }

  beforeAll(async () => {
    db = await createScratchDb(process.env.DATABASE_SUPER_URL as string);
    sql = db.sql;
    other = postgres(db.url, { max: 1, onnotice: () => undefined });
    reader = postgres(db.url, { max: 1, onnotice: () => undefined });
    await ensureLedger(sql);
    await sql`CREATE TABLE public.retry_probe (id int)`;
    await sql`CREATE TABLE public.retry_count (n int)`;
  }, 60_000);

  afterAll(async () => {
    await other?.end({ timeout: 5 });
    await reader?.end({ timeout: 5 });
    await db?.drop();
  });

  it('no transaction: retries the blocked statement alone, and readers never wait long', async () => {
    const seen: number[] = [];
    const hold = await holdProbe();
    setTimeout(hold.release, 1500);
    const migrating = applyMigration(
      sql,
      file(
        '9001_retry_notx.sql',
        `-- xangarro:no-transaction
SET lock_timeout = '100ms';
INSERT INTO public.retry_count VALUES (1);
ALTER TABLE public.retry_probe ADD COLUMN IF NOT EXISTS a int;`,
      ),
      fast(seen),
    );
    await sleep(300);
    const t0 = Date.now();
    await reader`SELECT count(*) FROM public.retry_probe`;
    const waited = Date.now() - t0;
    await migrating;
    await hold.done;
    assert.ok(seen.length > 0, 'it did have to retry');
    assert.ok(waited < 1000, `a reader queued ${waited} ms behind the waiting ALTER`);
    const [n] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM public.retry_count`;
    assert.equal(n?.n, 1, 'the statements before the blocked one ran once');
    const [col] = await sql<{ n: number }[]>`
      SELECT count(*)::int AS n FROM information_schema.columns
       WHERE table_name = 'retry_probe' AND column_name = 'a'`;
    assert.equal(col?.n, 1);
    assert.ok((await readApplied(sql)).some((r) => r.name === 'data-pg/9001_retry_notx.sql'));
    const [t] = await sql<{ v: string }[]>`SELECT current_setting('lock_timeout') AS v`;
    assert.equal(t?.v, '0', 'the reserved session is reset afterwards');
  });

  it('transactional: rolls back and retries the whole file', async () => {
    const seen: number[] = [];
    const hold = await holdProbe();
    setTimeout(hold.release, 800);
    // A bare CREATE TABLE fails on a second run unless the first rolled back.
    await applyMigration(
      sql,
      file(
        '9002_retry_tx.sql',
        `SET LOCAL lock_timeout = '100ms';
CREATE TABLE public.retry_side (id int);
ALTER TABLE public.retry_probe ADD COLUMN IF NOT EXISTS b int;`,
      ),
      fast(seen),
    );
    await hold.done;
    assert.ok(seen.length > 0, 'it did have to retry');
    assert.equal(
      (await readApplied(sql)).filter((r) => r.name === 'data-pg/9002_retry_tx.sql').length,
      1,
    );
  });

  it('gives up after the last attempt, with the lock error and no ledger row', async () => {
    const seen: number[] = [];
    const hold = await holdProbe();
    try {
      await assert.rejects(
        () =>
          applyMigration(
            sql,
            file(
              '9003_retry_gives_up.sql',
              `SET LOCAL lock_timeout = '50ms';
ALTER TABLE public.retry_probe ADD COLUMN IF NOT EXISTS c int;`,
            ),
            fast(seen, 3),
          ),
        (e: unknown) => isLockTimeout(e),
      );
    } finally {
      hold.release();
      await hold.done;
    }
    assert.deepEqual(seen, [1, 2]);
    assert.ok(!(await readApplied(sql)).some((r) => r.name === 'data-pg/9003_retry_gives_up.sql'));
  });

  it('never retries an error that is not a lock timeout', async () => {
    const seen: number[] = [];
    await assert.rejects(
      () => applyMigration(sql, file('9004_retry_bad.sql', 'SELECT 1 / 0;'), fast(seen)),
      /division by zero/,
    );
    assert.deepEqual(seen, []);
  });
});
