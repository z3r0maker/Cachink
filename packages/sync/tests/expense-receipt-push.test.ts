/**
 * A gasto's receipt reaches the push like an expense row does (ADR-149): the
 * change-log trigger queues it, the outbox reads it from SQLite, and the row
 * it reads is the wire's `expense_receipts` row with its base64 unchanged.
 */

import { describe, expect, it } from 'vitest';
import { PUSH_ROW_SCHEMAS, isPullable } from '@xangarro/contracts';
import { DrizzleExpenseReceiptsRepository } from '@xangarro/data';
import type { BusinessId, ExpenseId } from '@xangarro/domain';
import { TEST_DEVICE_ID } from '../../testing/src/index.js';
import { makeFreshDb } from '../../data/tests/helpers/fresh-db.js';
import { coalesce, readChangeSlice } from '../src/outbox-reader.js';
import { readRows } from '../src/row-reader.js';
import { rowKey } from '../src/table-map.js';

const BYTES = Buffer.alloc(600, 7).toString('base64');

describe('expense_receipts in the outbox', () => {
  it('is read from SQLite into a valid push row, bytes as the same text', async () => {
    const db = makeFreshDb();
    const row = await new DrizzleExpenseReceiptsRepository(db, TEST_DEVICE_ID).create({
      gastoId: '01HZ8XQN9GZJXV8AKQ5X0C7GS1' as ExpenseId,
      bytes: BYTES,
      width: 768,
      height: 1024,
      businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId,
    });
    const changes = coalesce(await readChangeSlice(db, 0));
    expect(changes).toEqual([{ tableName: 'expense_receipts', rowId: row.id, op: 'insert' }]);
    const read = (await readRows(db, changes)).get(rowKey('expense_receipts', row.id));
    const parsed = PUSH_ROW_SCHEMAS.expense_receipts.parse(read);
    expect(parsed).toEqual(row);
    expect(parsed.bytes).toBe(BYTES);
  });

  it('is never pulled, so no applier writes it', () => {
    expect(isPullable('expense_receipts')).toBe(false);
  });
});
