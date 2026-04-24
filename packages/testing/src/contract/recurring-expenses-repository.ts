/**
 * Shared contract for {@link RecurringExpensesRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, IsoDate } from '@cachink/domain';
import type { RecurringExpensesRepository } from '@cachink/data';
import { makeNewRecurringExpense } from '../fixtures/recurring-expense.js';

const BIZ_A = '01HZ8XQN9GZJXV8AKQ5X0C7A01' as BusinessId;
const BIZ_B = '01HZ8XQN9GZJXV8AKQ5X0C7A02' as BusinessId;
const APR_22 = '2026-04-22' as IsoDate;
const APR_23 = '2026-04-23' as IsoDate;
const APR_30 = '2026-04-30' as IsoDate;
const MAY_01 = '2026-05-01' as IsoDate;

export function describeRecurringExpensesRepositoryContract(
  implName: string,
  makeRepo: () => RecurringExpensesRepository,
): void {
  describe(`RecurringExpensesRepository contract — ${implName}`, () => {
    let repo: RecurringExpensesRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('stamps audit + defaults activo to true', async () => {
      const row = await repo.create(
        makeNewRecurringExpense({ businessId: BIZ_A, activo: undefined }),
      );
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.activo).toBe(true);
      expect(row.deletedAt).toBeNull();
    });

    it('findById returns row, null for missing or deleted', async () => {
      const row = await repo.create(makeNewRecurringExpense({ businessId: BIZ_A }));
      expect(await repo.findById(row.id)).toEqual(row);
      await repo.delete(row.id);
      expect(await repo.findById(row.id)).toBeNull();
    });

    it('findDue returns only active rows whose proximoDisparo <= today', async () => {
      const due = await repo.create(
        makeNewRecurringExpense({ businessId: BIZ_A, proximoDisparo: APR_22 }),
      );
      const notYet = await repo.create(
        makeNewRecurringExpense({ businessId: BIZ_A, proximoDisparo: MAY_01 }),
      );
      const inactive = await repo.create(
        makeNewRecurringExpense({
          businessId: BIZ_A,
          proximoDisparo: APR_22,
          activo: false,
        }),
      );
      const otherBiz = await repo.create(
        makeNewRecurringExpense({ businessId: BIZ_B, proximoDisparo: APR_22 }),
      );
      const rows = await repo.findDue(APR_23, BIZ_A);
      const ids = rows.map((r) => r.id);
      expect(ids).toContain(due.id);
      expect(ids).not.toContain(notYet.id);
      expect(ids).not.toContain(inactive.id);
      expect(ids).not.toContain(otherBiz.id);
    });

    it('findDue treats proximoDisparo === today as due', async () => {
      const row = await repo.create(
        makeNewRecurringExpense({ businessId: BIZ_A, proximoDisparo: APR_23 }),
      );
      const rows = await repo.findDue(APR_23, BIZ_A);
      expect(rows.some((r) => r.id === row.id)).toBe(true);
    });

    it('markFired advances proximoDisparo and bumps updatedAt', async () => {
      const row = await repo.create(
        makeNewRecurringExpense({ businessId: BIZ_A, proximoDisparo: APR_23 }),
      );
      const originalUpdated = row.updatedAt;
      await new Promise((r) => setTimeout(r, 5));
      await repo.markFired(row.id, APR_30);
      const reloaded = await repo.findById(row.id);
      expect(reloaded?.proximoDisparo).toBe(APR_30);
      expect(reloaded && reloaded.updatedAt.localeCompare(originalUpdated)).toBeGreaterThanOrEqual(
        0,
      );
    });

    it('markFired on a missing id is a no-op', async () => {
      await expect(
        repo.markFired('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never, APR_30),
      ).resolves.toBeUndefined();
    });

    it('delete on missing id is a no-op', async () => {
      await expect(repo.delete('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).resolves.toBeUndefined();
    });

    it('preserves montoCentavos as bigint', async () => {
      const row = await repo.create(
        makeNewRecurringExpense({ businessId: BIZ_A, montoCentavos: 12_345_678n }),
      );
      expect(typeof row.montoCentavos).toBe('bigint');
    });
  });
}
