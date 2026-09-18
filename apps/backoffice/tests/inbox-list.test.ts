import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import type { SupportItem, SupportItemId } from '@xangarro/domain';

import { listSupportItems, SAVED_FILTERS } from '@/server/inbox/list';

import { BUSINESS, brokenRepo, CFDI, item, rejectsWith, seeded, STAFF } from './support/inbox';

const at = (min: number) => new Date(Date.UTC(2026, 8, 17, 12, min)).toISOString();
const id = (n: number) => `01HZ8XQN9GZJXV8AKQ5X0C${String(n).padStart(4, '0')}` as SupportItemId;

const rows: SupportItem[] = [
  item({ id: id(1), createdAt: at(1), sourceRef: 'a' }),
  item({ id: id(2), createdAt: at(2), sourceRef: 'b', urgent: true, ownerStaffId: STAFF }),
  item({ id: id(3), createdAt: at(3), sourceRef: 'c', kind: 'factura', paymentRef: 'in_3' }),
  item({
    id: id(4),
    createdAt: at(4),
    sourceRef: 'd',
    kind: 'factura',
    paymentRef: 'in_4',
    status: 'resuelto',
    cfdiUuid: CFDI,
    resolvedAt: at(5),
  }),
  item({ id: id(5), createdAt: at(4), sourceRef: 'e', businessId: BUSINESS, status: 'en_curso' }),
];

const ids = (items: readonly SupportItem[]) => items.map((i) => i.id);

describe('listSupportItems', () => {
  it('returns newest first, ties broken by id', async () => {
    const { items, nextCursor } = await listSupportItems(seeded(...rows), {});
    assert.deepEqual(ids(items), [id(5), id(4), id(3), id(2), id(1)]);
    assert.equal(nextCursor, null);
  });

  it('pages by keyset without skipping or repeating a row', async () => {
    const repo = seeded(...rows);
    const seen: SupportItemId[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 5; page += 1) {
      const res = await listSupportItems(repo, { limit: 2, cursor });
      seen.push(...ids(res.items));
      if (res.nextCursor === null) break;
      cursor = res.nextCursor;
    }
    assert.deepEqual(seen, [id(5), id(4), id(3), id(2), id(1)]);
  });

  it('filters by kind, status, urgency, owner and business', async () => {
    const repo = seeded(...rows);
    const pick = async (q: object) => ids((await listSupportItems(repo, q)).items);
    assert.deepEqual(await pick({ kinds: ['factura'] }), [id(4), id(3)]);
    assert.deepEqual(await pick({ statuses: ['en_curso'] }), [id(5)]);
    assert.deepEqual(await pick({ urgent: true }), [id(2)]);
    assert.deepEqual(await pick({ ownerStaffId: STAFF }), [id(2)]);
    assert.deepEqual(await pick({ businessId: BUSINESS }), [id(5)]);
  });

  it('«Pagos sin CFDI» is the open factura items', async () => {
    const { items } = await listSupportItems(seeded(...rows), SAVED_FILTERS.pagos_sin_cfdi.query);
    assert.deepEqual(ids(items), [id(3)]);
  });

  it('refuses an unknown kind and an out-of-range limit', async () => {
    await rejectsWith(listSupportItems(seeded(), { kinds: ['queja'] }), 'VALIDATION');
    await rejectsWith(listSupportItems(seeded(), { limit: 0 }), 'VALIDATION');
    await rejectsWith(listSupportItems(seeded(), { limit: 101 }), 'VALIDATION');
  });

  it('refuses a cursor it did not mint', async () => {
    await rejectsWith(listSupportItems(seeded(), { cursor: 'not-a-cursor' }), 'INVALID_CURSOR');
    const forged = Buffer.from('ayer|x').toString('base64url');
    await rejectsWith(listSupportItems(seeded(), { cursor: forged }), 'INVALID_CURSOR');
  });

  it('wraps a store failure', async () => {
    await rejectsWith(listSupportItems(brokenRepo(), {}), 'STORE_FAILED');
  });
});
