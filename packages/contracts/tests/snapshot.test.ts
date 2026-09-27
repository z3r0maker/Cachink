import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ActivateRequestSchema, ActivateResponseSchema, BootstrapSchema } from '../src/activate.js';
import {
  MAX_SNAPSHOT_PAGE_BYTES,
  MAX_SNAPSHOT_PAGE_ROWS,
  SNAPSHOT_SECTIONS,
  SnapshotInfoSchema,
  decodeSnapshotToken,
  encodeSnapshotToken,
  type SnapshotCursor,
  type SnapshotSection,
} from '../src/snapshot.js';
import { fillSnapshotPage, pageTables, type SnapshotItem } from '../src/snapshot-page.js';
import { PullQuerySchema, PullResponseSchema } from '../src/sync-pull.js';

const START: SnapshotCursor = {
  c: 42,
  cutoff: '2026-06-28T00:00:00.000Z',
  s: 'businesses',
  a: null,
};

/** An in-memory tenant: `n` rows per section, keys sortable, each ~`pad` bytes. */
function tenant(counts: Partial<Record<SnapshotSection, number>>, pad = 10) {
  const data = new Map<SnapshotSection, SnapshotItem[]>();
  for (const s of SNAPSHOT_SECTIONS) {
    const n = counts[s] ?? 0;
    data.set(
      s,
      Array.from({ length: n }, (_, i) => {
        const key = `${s}-${String(i).padStart(6, '0')}`;
        return { key, row: { id: key, pad: 'x'.repeat(pad) } };
      }),
    );
  }
  const reads: { section: SnapshotSection; after: string | null; limit: number }[] = [];
  const read = async (section: SnapshotSection, after: string | null, limit: number) => {
    reads.push({ section, after, limit });
    const all = data.get(section) ?? [];
    return all.filter((r) => after === null || r.key > after).slice(0, limit);
  };
  return { read, reads, data };
}

/** Page through the whole snapshot, returning every key in the order it arrived. */
async function drain(
  read: Parameters<typeof fillSnapshotPage>[0],
  budget: { rows: number; bytes: number },
) {
  const keys: string[] = [];
  let cursor: SnapshotCursor | null = START;
  let pages = 0;
  while (cursor !== null) {
    const page = await fillSnapshotPage(read, cursor, budget);
    const rows = Object.values(page.sections).flat();
    assert.ok(rows.length <= budget.rows, `page ${pages} has ${rows.length} rows`);
    for (const r of rows) keys.push(String(r['id']));
    cursor = page.next;
    pages += 1;
    assert.ok(pages < 10_000, 'the pager makes progress');
  }
  return { keys, pages };
}

describe('snapshot token (C-23)', () => {
  it('round-trips a cursor through an opaque, URL-safe token', () => {
    const cursor: SnapshotCursor = {
      ...START,
      s: 'inventory_movements',
      a: '01HZ8XQN9GZJXV8AKQ5X0C7SA0',
    };
    const token = encodeSnapshotToken(cursor);
    assert.match(token, /^[A-Za-z0-9_-]+$/);
    assert.deepEqual(decodeSnapshotToken(token), cursor);
  });

  it('refuses garbage, a wrong section and a negative cursor instead of guessing', () => {
    assert.equal(decodeSnapshotToken('not a token'), null);
    assert.equal(decodeSnapshotToken(''), null);
    const bad = (o: object) => encodeSnapshotToken(o as SnapshotCursor);
    assert.equal(decodeSnapshotToken(bad({ ...START, s: 'sales' })), null);
    assert.equal(decodeSnapshotToken(bad({ ...START, c: -1 })), null);
    assert.equal(decodeSnapshotToken(bad({ ...START, cutoff: 'yesterday' })), null);
  });
});

describe('fillSnapshotPage (C-23)', () => {
  it('sends a small tenant in one page, sections in dependency order, and ends the snapshot', async () => {
    const t = tenant({
      businesses: 1,
      users: 2,
      products: 3,
      stock_baseline: 3,
      inventory_movements: 4,
    });
    const page = await fillSnapshotPage(t.read, START);
    assert.equal(page.next, null);
    assert.deepEqual(Object.keys(page.sections), [...SNAPSHOT_SECTIONS]);
    assert.equal(page.sections.inventory_movements?.length, 4);
    assert.ok(
      SNAPSHOT_SECTIONS.indexOf('products') < SNAPSHOT_SECTIONS.indexOf('inventory_movements'),
    );
    assert.ok(
      SNAPSHOT_SECTIONS.indexOf('clients') < SNAPSHOT_SECTIONS.indexOf('opening_balance_clients'),
    );
  });

  it('pages 30K movements under the row budget with no gap and no repeat', async () => {
    const t = tenant({
      businesses: 1,
      products: 1_200,
      stock_baseline: 1_200,
      inventory_movements: 30_000,
    });
    const { keys, pages } = await drain(t.read, {
      rows: MAX_SNAPSHOT_PAGE_ROWS,
      bytes: MAX_SNAPSHOT_PAGE_BYTES,
    });
    const expected = SNAPSHOT_SECTIONS.flatMap((s) => (t.data.get(s) ?? []).map((r) => r.key));
    assert.deepEqual(keys, expected);
    assert.equal(pages, Math.ceil(expected.length / MAX_SNAPSHOT_PAGE_ROWS));
  });

  it('cuts a page on bytes before rows, and still moves on when one row alone is over budget', async () => {
    const t = tenant({ businesses: 1, products: 50 }, 1_000);
    const byBytes = await drain(t.read, { rows: 5_000, bytes: 10_000 });
    assert.equal(byBytes.keys.length, 51);
    assert.ok(byBytes.pages >= 5, `${byBytes.pages} pages for ~51 KB at 10 KB a page`);
    const huge = await drain(t.read, { rows: 5_000, bytes: 10 });
    assert.equal(huge.keys.length, 51, 'one oversized row per page, never stuck');
  });

  it('resumes a section from the key it stopped at, not from the start', async () => {
    const t = tenant({ businesses: 1, clients: 10 });
    const first = await fillSnapshotPage(t.read, START, { rows: 6, bytes: 1e6 });
    assert.deepEqual(first.next, { ...START, s: 'clients', a: 'clients-000004' });
    const second = await fillSnapshotPage(t.read, first.next!, { rows: 6, bytes: 1e6 });
    assert.equal(second.sections.clients?.[0]?.['id'], 'clients-000005');
    assert.equal(second.next, null);
  });

  it('maps sections to the pull tables, the baseline kept apart', () => {
    const t = pageTables({
      products: [{ id: 'p' }],
      stock_baseline: [{ productoId: 'p', cantidad: 3 }],
    });
    assert.deepEqual(t.tables.products, [{ id: 'p' }]);
    assert.deepEqual(t.tables.inventory_movements, []);
    assert.equal('stock_baseline' in t.tables, false);
    assert.deepEqual(t.stockBaseline, [{ productoId: 'p', cantidad: 3 }]);
  });
});

describe('snapshot on the wire: additive at protocol 1 (C-23)', () => {
  const device = { name: 'iPhone', platform: 'ios', appVersion: '1.0.0', osVersion: '18.1' };

  it('an old device request — no `bootstrap` — still parses; a new one opts in', () => {
    const old = ActivateRequestSchema.parse({ email: 'a@b.mx', code: 'K7M3P9RW', device });
    assert.equal((old as { bootstrap?: string }).bootstrap, undefined);
    const typed = ActivateRequestSchema.parse({
      email: 'a@b.mx',
      code: 'K7M3P9RW',
      device,
      bootstrap: 'snapshot',
    });
    assert.equal(typed.bootstrap, 'snapshot');
    const scan = ActivateRequestSchema.parse({
      qrToken: 'dev-only-not-a-real-secret',
      device,
      bootstrap: 'snapshot',
    });
    assert.equal(scan.bootstrap, 'snapshot');
    assert.throws(() =>
      ActivateRequestSchema.parse({ email: 'a@b.mx', code: 'K7M3P9RW', device, bootstrap: 'full' }),
    );
  });

  it('an old server response — no `snapshot` — parses on a new device as a complete bootstrap', () => {
    const tables = {
      businesses: [],
      products: [],
      clients: [],
      users: [],
      employees: [],
      recurring_expenses: [],
      feature_flags: {},
    };
    const boot = BootstrapSchema.parse({ serverSeq: 7, serverTime: START.cutoff, tables });
    assert.equal(boot.snapshot, undefined);
    assert.equal(PullQuerySchema.parse({ since: '7' }).snapshot, undefined);
    const pullShape = ActivateResponseSchema.shape.bootstrap;
    assert.ok(pullShape.safeParse({ serverSeq: 0, serverTime: START.cutoff, tables }).success);
  });

  it('a snapshot page carries its cutoff, whether it is the first, the next token and the baseline', () => {
    const info = SnapshotInfoSchema.parse({ cutoff: START.cutoff, first: true, next: 'abc' });
    assert.deepEqual(info.stockBaseline, [], 'baseline defaults empty');
    assert.throws(() => SnapshotInfoSchema.parse({ cutoff: START.cutoff, first: true, next: '' }));
    assert.throws(() =>
      SnapshotInfoSchema.parse({ ...info, stockBaseline: [{ productoId: 'p', cantidad: 1.5 }] }),
    );
    assert.ok(PullResponseSchema.shape.snapshot.safeParse(undefined).success);
    assert.equal(PullQuerySchema.parse({ since: '0', snapshot: 'start' }).snapshot, 'start');
    assert.throws(() => PullQuerySchema.parse({ since: '0', snapshot: 'x'.repeat(600) }));
  });
});
