import { afterAll, beforeAll, it } from 'vitest';
import assert from 'node:assert/strict';
import postgres from 'postgres';

import { createDb } from '../src/client';
import { recordApiLatency } from '../src/security/api-latency';
import { integrationSuite } from './support/db';

/**
 * The latency histogram's shape and its grants, against real Postgres as the
 * real roles (N-07, `0042_api_latency.sql`).
 *
 * Two things are worth proving here rather than reasoning about. First, that
 * the bucketing is the *upper* bound — the whole safety property of the card
 * is that it rounds latency up, so it can only ever over-state. Second, that
 * the app role can count a call and cannot read the table back: this is
 * platform telemetry with no tenant on it, and the only reason that stays true
 * is the absent grant.
 */
const { url, describe } = integrationSuite();

function asRole(appUrl: string, role: string): string {
  const u = new URL(appUrl);
  u.username = role;
  u.password = role;
  return u.toString();
}

/** Today's row for one bucket, as the owner sees it. */
async function hitsEn(sql: postgres.Sql, endpoint: string, bucket: number): Promise<number> {
  const rows = await sql<{ hits: number }[]>`
    SELECT hits FROM xangarro.api_latency_counters
     WHERE endpoint = ${endpoint} AND bucket_ms = ${bucket}
       AND day = (now() AT TIME ZONE 'America/Mexico_City')::date`;
  return rows[0]?.hits ?? 0;
}

describe('xangarro.api_latency_counters: the app counts, nobody reads it back', () => {
  let owner: postgres.Sql;
  let app: postgres.Sql;
  let db: ReturnType<typeof createDb>;

  beforeAll(() => {
    owner = postgres(process.env.DATABASE_SUPER_URL ?? (url as string), {
      max: 1,
      onnotice: () => undefined,
    });
    app = postgres(asRole(url as string, 'xangarro_app'), { max: 1, onnotice: () => undefined });
    db = createDb(asRole(url as string, 'xangarro_app'));
  });

  afterAll(async () => {
    await owner`DELETE FROM xangarro.api_latency_counters WHERE endpoint = 'comprobante'`;
    await Promise.all([owner.end({ timeout: 5 }), app.end({ timeout: 5 })]);
  });

  it('files a call under its bucket, and the bucket is the upper bound', async () => {
    const antes = await hitsEn(owner, 'comprobante', 200);
    // 101 ms belongs to the 200 bucket: rounded up, never down.
    await recordApiLatency(db, 'comprobante', 101);
    assert.equal(await hitsEn(owner, 'comprobante', 200), antes + 1);
    // The exact bound stays in its own bucket rather than spilling up.
    const enCien = await hitsEn(owner, 'comprobante', 100);
    await recordApiLatency(db, 'comprobante', 100);
    assert.equal(await hitsEn(owner, 'comprobante', 100), enCien + 1);
  });

  it('counts a second call into the same row, never a second row', async () => {
    const antes = await hitsEn(owner, 'comprobante', 50);
    await recordApiLatency(db, 'comprobante', 33);
    await recordApiLatency(db, 'comprobante', 41);
    assert.equal(await hitsEn(owner, 'comprobante', 50), antes + 2);
    const filas = await owner<{ n: string }[]>`
      SELECT count(*)::text AS n FROM xangarro.api_latency_counters
       WHERE endpoint = 'comprobante' AND bucket_ms = 50
         AND day = (now() AT TIME ZONE 'America/Mexico_City')::date`;
    assert.equal(filas[0]?.n, '1', 'one row per (day, endpoint, bucket)');
  });

  it('anything past the top bound lands in the overflow bucket, not a new bound', async () => {
    const antes = await hitsEn(owner, 'comprobante', 0);
    await recordApiLatency(db, 'comprobante', 45_000);
    assert.equal(await hitsEn(owner, 'comprobante', 0), antes + 1);
  });

  it('refuses an endpoint outside the list, so the table stays bounded', async () => {
    // Raw SQL on purpose: `recordApiLatency`'s type forbids this, and the
    // guard being in the database too is what keeps the table bounded when a
    // future caller reaches the function another way.
    await assert.rejects(
      () => app`SELECT xangarro.api_latency_record('sync/nope', 5)`,
      /unknown api endpoint/,
    );
  });

  it('the app role cannot read the histogram back, only add to it', async () => {
    await assert.rejects(
      () => app`SELECT count(*) FROM xangarro.api_latency_counters`,
      /permission denied/,
    );
  });

  it('the app role cannot delete history, even its own', async () => {
    await assert.rejects(() => app`DELETE FROM xangarro.api_latency_counters`, /permission denied/);
  });
});

describe("xangarro.admin_sync_p95: the console's read of the histogram", () => {
  let owner: postgres.Sql;

  const p95 = async (): Promise<number | null> => {
    const rows = await owner<{ ms: number | null }[]>`SELECT xangarro.admin_sync_p95(1) AS ms`;
    return rows[0]?.ms ?? null;
  };
  const contar = (endpoint: string, ms: number, veces: number) =>
    owner`SELECT xangarro.api_latency_record(${endpoint}, ${ms}) FROM generate_series(1, ${veces})`;

  beforeAll(async () => {
    owner = postgres(process.env.DATABASE_SUPER_URL ?? (url as string), {
      max: 1,
      onnotice: () => undefined,
    });
    // This function reads every tenant's calls, so the suite owns the table
    // for the duration — there is nothing tenant-scoped to isolate by.
    await owner`DELETE FROM xangarro.api_latency_counters`;
  });

  afterAll(async () => {
    await owner`DELETE FROM xangarro.api_latency_counters`;
    await owner.end({ timeout: 5 });
  });

  it('is «sin datos», not a number, when nothing has synced', async () => {
    // The bug this test exists for: `least(min(orden), 5000)` ignores NULL, so
    // an empty table answered 5000 — a red five-second p95 on a database where
    // no phone had ever called.
    assert.equal(await p95(), null);
  });

  it('is the bucket the 95th call falls in, rounded up to its bound', async () => {
    await contar('sync/push', 40, 90);
    await contar('sync/pull', 700, 6);
    await contar('sync/push', 9000, 4);
    // 100 calls: 90 at ≤50, 6 at ≤700 (96 %), 4 over the top bound. The 95th
    // is in the 700 bucket.
    assert.equal(await p95(), 700);
  });

  it('reports the top bound when the slowest 5 % are past it', async () => {
    await owner`DELETE FROM xangarro.api_latency_counters`;
    await contar('sync/push', 30, 90);
    await contar('sync/push', 9000, 10);
    assert.equal(await p95(), 5000);
  });

  it('ignores endpoints that are not sync — the card is about the phone', async () => {
    await owner`DELETE FROM xangarro.api_latency_counters`;
    await contar('comprobante', 9000, 50);
    assert.equal(await p95(), null, 'a slow comprobante is not a slow sync');
    await contar('sync/pull', 40, 50);
    assert.equal(await p95(), 50);
  });
});
