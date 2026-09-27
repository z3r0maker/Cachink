import assert from 'node:assert/strict';
import { afterAll, beforeAll, it, vi } from 'vitest';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { ApplyPushUseCase } from '@xangarro/application';
import type { Delta, PushableTable } from '@xangarro/contracts';
import { createDb, shellCounts, withBusiness, type Db } from '@xangarro/data-pg';
import { integrationSuite } from '@xangarro/testing/integration';

import { PgPushStore } from '../src/server/sync/pg-push-store';
import { PUSH_T1, PUSH_TOUCHED, pushFixtures, pushId as id } from './support/push-fixtures';

/**
 * What no row can do to a push on real Postgres (audit DB3-SYNC-01, -03, -04;
 * ADR-117 amendment): a NUL cannot fail it, a payload `jsonb` refuses cannot
 * fail it, a duplicate folio is answered terminally, an overlapping retry is
 * answered from the original's receipts, and a retry that succeeds closes the
 * rejection the portal was counting. Same database contract as
 * `sync-push.integration.test.ts`.
 */
const { url, describe: suite } = integrationSuite();

/** On, the rejection payload is JSON text `jsonb` refuses (22P05), as a NUL escape once was. */
const hostile = vi.hoisted(() => ({ on: false }));
vi.mock('../src/server/sync/rejection-payload', async (importOriginal) => {
  type Payload = (table: PushableTable, row: Record<string, unknown>) => string;
  const real = await importOriginal<{ rejectionPayload: Payload }>();
  const rejectionPayload: Payload = (table, row) =>
    hostile.on ? '{"row":"\\u0000"}' : real.rejectionPayload(table, row);
  return { rejectionPayload };
});

const A = id();
const DEVICE = id();
const { expense, product, movement, ticket } = pushFixtures(A, DEVICE);
const codes = (r: { rejected: { rowId: string; code: string; retryable: boolean }[] }) =>
  r.rejected.map((x) => [x.rowId, x.code, x.retryable]);

suite('push bookkeeping on Postgres', () => {
  let db: Db;
  let owner: postgres.Sql;
  const errors: unknown[] = [];

  /** One push in one tenant transaction, as the route runs it; `before` runs first in it. */
  const push = (deltas: Delta[], before?: string) =>
    withBusiness(db, A, async (tx) => {
      if (before !== undefined) await tx.execute(sql.raw(before));
      return new ApplyPushUseCase(new PgPushStore(tx, A, DEVICE), A, (e) => errors.push(e)).execute(
        { deltas },
      );
    });
  const pending = () => withBusiness(db, A, async (tx) => (await shellCounts(tx, A)).pendingRows);
  const rejection = async (rowId: string) =>
    (
      await owner`SELECT code, payload, resolved_at FROM sync_rejections WHERE row_id = ${rowId}`
    )[0];

  beforeAll(async () => {
    db = createDb(url as string, { max: 4 });
    owner = postgres(process.env.DATABASE_SUPER_URL as string, { max: 2, onnotice: () => {} });
    await owner`
      INSERT INTO devices (id, nombre, plataforma, business_id, created_at, updated_at)
      VALUES (${DEVICE}, 'Caja', 'android', ${A}, ${PUSH_T1}, ${PUSH_T1})`;
  });

  afterAll(async () => {
    for (const table of PUSH_TOUCHED) {
      await owner?.unsafe(`DELETE FROM ${table} WHERE business_id = $1`, [A]);
    }
    await db?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('stores the good rows of a push that carries a NUL, and refuses that row for good', async () => {
    const [e1, e2, e3] = [expense(id()), expense(id()), expense(id())];
    const good = [e1, e2, e3];
    const bad = expense(id(), { concepto: 'Refresco\u0000' });
    const r = await push([e1, bad, e2, e3]);
    assert.deepEqual(codes(r), [[bad.rowId, 'VALIDATION', false]]);
    assert.equal(r.accepted.length, 3);
    const stored = await owner`SELECT id FROM expenses WHERE id = ANY(${good.map((g) => g.rowId)})`;
    assert.equal(stored.length, 3);
    const kept = await rejection(bad.rowId);
    assert.equal(kept?.['payload'].row.concepto, 'Refresco', 'kept, cleaned');
  });

  it('keeps a rejection without its payload when jsonb refuses the payload', async () => {
    errors.length = 0;
    hostile.on = true;
    try {
      const good = expense(id());
      const dangling = movement(id(), id());
      const r = await push([dangling, good]);
      assert.deepEqual(codes(r), [[dangling.rowId, 'FK_PRODUCT_MISSING', false]]);
      assert.equal(r.accepted.length, 1);
      assert.equal((await owner`SELECT 1 FROM expenses WHERE id = ${good.rowId}`).length, 1);
      const kept = await rejection(dangling.rowId);
      assert.equal(kept?.['code'], 'FK_PRODUCT_MISSING');
      assert.equal(kept?.['payload'], null);
      assert.equal(errors.length, 1, 'the dropped payload is logged');
    } finally {
      hostile.on = false;
    }
  });

  it('answers a folio another ticket of this device holds DUPLICATE_CONFLICT, terminally', async () => {
    const first = await push([ticket(id(), 7)]);
    assert.equal(first.accepted.length, 1);
    const clash = ticket(id(), 7);
    const r = await push([clash, ticket(id(), 8), expense(id())]);
    assert.deepEqual(codes(r), [[clash.rowId, 'DUPLICATE_CONFLICT', false]]);
    assert.equal(r.accepted.length, 2);
  });

  it('resolves an INTERNAL rejection once its retry is accepted, and the badge drops', async () => {
    const rows = [expense(id()), expense(id())];
    const before = await pending();
    const timedOut = await owner.begin(async (o) => {
      await o`LOCK TABLE expenses IN EXCLUSIVE MODE`;
      return push(rows, "SET LOCAL lock_timeout = '150ms'");
    });
    assert.deepEqual(
      codes(timedOut),
      rows.map((d) => [d.rowId, 'INTERNAL', true]),
    );
    assert.equal(await pending(), before + 2);

    const retry = await push(rows);
    assert.equal(retry.accepted.length, 2);
    assert.equal(await pending(), before, 'the portal no longer counts them');
    for (const d of rows) assert.notEqual((await rejection(d.rowId))?.['resolved_at'], null);
  });

  it('answers a retry that overlaps its original from the original’s receipts', async () => {
    const p = id();
    const deltas = [product(p), movement(id(), p)];
    let wrote!: () => void;
    let release!: () => void;
    const written = new Promise<void>((resolve) => (wrote = resolve));
    const gate = new Promise<void>((resolve) => (release = resolve));
    const original = withBusiness(db, A, async (tx) => {
      const r = await new ApplyPushUseCase(new PgPushStore(tx, A, DEVICE), A, () => {}).execute({
        deltas,
      });
      wrote();
      await gate; // not committed yet: the retry's insert waits on these rows
      return r;
    });
    await written;
    const retry = push(deltas);
    await waitForLockWait(owner);
    release();
    const [a, b] = await Promise.all([original, retry]);
    assert.deepEqual(codes(b), [], 'no false DUPLICATE_CONFLICT or FK_PRODUCT_MISSING');
    assert.deepEqual(
      b.accepted.map((x) => x.serverSeq),
      a.accepted.map((x) => x.serverSeq),
    );
  });
});

/** Until a backend waits on a row lock for a products insert (5 s at most). */
async function waitForLockWait(owner: postgres.Sql): Promise<void> {
  for (let i = 0; i < 100; i += 1) {
    const [row] = await owner`
      SELECT count(*)::int AS n FROM pg_stat_activity
      WHERE wait_event_type = 'Lock' AND query ILIKE 'insert into "products"%'`;
    if ((row?.['n'] as number) > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('the overlapping push never waited on the original');
}
