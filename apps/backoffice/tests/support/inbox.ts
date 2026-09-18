import assert from 'node:assert/strict';

import type { BusinessId, StaffMemberId, SupportItem, SupportItemId } from '@xangarro/domain';

import { SupportItemError } from '@/server/inbox/errors';
import { InMemorySupportItems } from '@/server/inbox/memory';

export const STAFF = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as StaffMemberId;
export const OTHER_STAFF = '01HZ8XQN9GZJXV8AKQ5X0C7BJY' as StaffMemberId;
export const BUSINESS = '01HZ8XQN9GZJXV8AKQ5X0C7BK0' as BusinessId;
export const CFDI = '6F9619FF-8B86-D011-B42D-00C04FC964FF';
export const NOW = new Date('2026-09-17T18:00:00.000Z');

/** Deterministic ULIDs: a fixed prefix plus a counter in the last four chars. */
export function idSeq(): () => SupportItemId {
  let n = 0;
  return () => {
    n += 1;
    return `01HZ8XQN9GZJXV8AKQ5X0C${String(n).padStart(4, '0')}` as SupportItemId;
  };
}

export function item(overrides: Partial<SupportItem> = {}): SupportItem {
  return {
    id: '01HZ8XQN9GZJXV8AKQ5X0C0001' as SupportItemId,
    kind: 'bug',
    status: 'nuevo',
    urgent: false,
    ownerStaffId: null,
    businessId: null,
    title: 'Algo falla',
    body: '',
    attachments: [],
    source: 'bug-report',
    sourceRef: 'ref-1',
    paymentRef: null,
    cfdiUuid: null,
    createdAt: '2026-09-17T12:00:00.000Z',
    updatedAt: '2026-09-17T12:00:00.000Z',
    resolvedAt: null,
    ...overrides,
  };
}

export function seeded(...items: SupportItem[]): InMemorySupportItems {
  const repo = new InMemorySupportItems();
  for (const i of items) repo.rows.set(i.id, i);
  return repo;
}

/** A repository whose every call fails, to prove store errors are wrapped. */
export function brokenRepo(): InMemorySupportItems {
  const repo = new InMemorySupportItems();
  const boom = async (): Promise<never> => {
    throw new Error('connection reset');
  };
  repo.findById = boom;
  repo.insertIfAbsent = boom;
  repo.update = boom;
  repo.list = boom;
  repo.listForDigest = boom;
  return repo;
}

export async function rejectsWith(
  p: Promise<unknown>,
  code: SupportItemError['code'],
): Promise<void> {
  await assert.rejects(p, (e: unknown) => e instanceof SupportItemError && e.code === code);
}
