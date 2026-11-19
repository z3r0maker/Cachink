import { describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { BusinessId, ExpenseId } from '@xangarro/domain';
import { DrizzleExpenseReceiptsRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeExpenseReceiptsRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeExpenseReceiptsRepositoryContract('DrizzleExpenseReceiptsRepository', () => {
  const db = makeFreshDb();
  return new DrizzleExpenseReceiptsRepository(db, TEST_DEVICE_ID);
});

describe('DrizzleExpenseReceiptsRepository — the outbox', () => {
  it('a receipt reaches the change log as an insert', async () => {
    const db = makeFreshDb();
    const repo = new DrizzleExpenseReceiptsRepository(db, TEST_DEVICE_ID);
    const row = await repo.create({
      gastoId: '01HZ8XQN9GZJXV8AKQ5X0C7GS1' as ExpenseId,
      bytes: 'UklGRg==',
      width: 768,
      height: 1024,
      businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId,
    });
    const log = await db.all<{ op: string }>(
      sql`SELECT op FROM __xangarro_change_log WHERE table_name = 'expense_receipts' AND row_id = ${row.id}`,
    );
    expect(log).toEqual([{ op: 'insert' }]);
  });
});
