import type { Delta } from '@xangarro/contracts';

/** The pushing business, and two moments of a row's clock. */
export const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
export const T1 = '2026-09-11T18:30:00.000Z';
export const T2 = '2026-09-11T19:30:00.000Z';

/** A pushed row of `table`, owned by `BIZ` unless `over` says otherwise. */
export function delta(
  table: Delta['table'],
  id: string,
  over: Record<string, unknown> = {},
  op: Delta['op'] = 'insert',
  clientSeq = 1,
): Delta {
  const row = { id, businessId: BIZ, updatedAt: T1, createdByUserId: null, ...over };
  return { table, rowId: id, op, clientSeq, row } as unknown as Delta;
}
