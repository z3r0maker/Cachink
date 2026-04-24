/**
 * Shared contract for {@link ExpensesRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, IsoDate } from '@cachink/domain';
import type { ExpensesRepository } from '@cachink/data';
import { makeNewExpense } from '../fixtures/expense.js';
import { TEST_DEVICE_ID } from './_shared.js';

const BIZ_A = '01HZ8XQN9GZJXV8AKQ5X0C7A01' as BusinessId;
const BIZ_B = '01HZ8XQN9GZJXV8AKQ5X0C7A02' as BusinessId;
const APR_15 = '2026-04-15' as IsoDate;
const APR_23 = '2026-04-23' as IsoDate;
const MAY_01 = '2026-05-01' as IsoDate;

export function describeExpensesRepositoryContract(
  implName: string,
  makeRepo: () => ExpensesRepository,
): void {
  describe(`ExpensesRepository contract — ${implName}`, () => {
    let repo: ExpensesRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('stamps audit columns and preserves nullable proveedor + gastoRecurrenteId', async () => {
      const row = await repo.create(makeNewExpense({ businessId: BIZ_A }));
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.deviceId).toBe(TEST_DEVICE_ID);
      expect(row.proveedor).toBeNull();
      expect(row.gastoRecurrenteId).toBeNull();
      expect(row.deletedAt).toBeNull();
    });

    it('findById returns the row, null for missing or deleted', async () => {
      const row = await repo.create(makeNewExpense({ businessId: BIZ_A }));
      expect(await repo.findById(row.id)).toEqual(row);
      await repo.delete(row.id);
      expect(await repo.findById(row.id)).toBeNull();
    });

    it('findByDate scopes by businessId + date and excludes deleted rows', async () => {
      const keep = await repo.create(
        makeNewExpense({ businessId: BIZ_A, fecha: APR_23 }),
      );
      await repo.create(makeNewExpense({ businessId: BIZ_A, fecha: APR_15 }));
      await repo.create(makeNewExpense({ businessId: BIZ_B, fecha: APR_23 }));
      const drop = await repo.create(
        makeNewExpense({ businessId: BIZ_A, fecha: APR_23 }),
      );
      await repo.delete(drop.id);
      const rows = await repo.findByDate(APR_23, BIZ_A);
      expect(rows.map((r) => r.id)).toEqual([keep.id]);
    });

    it('findByMonth matches any day of the given month within businessId', async () => {
      await repo.create(makeNewExpense({ businessId: BIZ_A, fecha: APR_15 }));
      await repo.create(makeNewExpense({ businessId: BIZ_A, fecha: APR_23 }));
      await repo.create(makeNewExpense({ businessId: BIZ_A, fecha: MAY_01 }));
      await repo.create(makeNewExpense({ businessId: BIZ_B, fecha: APR_23 }));
      const rows = await repo.findByMonth('2026-04', BIZ_A);
      expect(rows).toHaveLength(2);
      expect(rows.every((r) => r.fecha.startsWith('2026-04'))).toBe(true);
    });

    it('findByCategory filters by categoria + inclusive date range', async () => {
      await repo.create(
        makeNewExpense({ businessId: BIZ_A, categoria: 'Renta', fecha: APR_15 }),
      );
      await repo.create(
        makeNewExpense({ businessId: BIZ_A, categoria: 'Servicios', fecha: APR_23 }),
      );
      await repo.create(
        makeNewExpense({ businessId: BIZ_A, categoria: 'Renta', fecha: MAY_01 }),
      );
      const rows = await repo.findByCategory('Renta', BIZ_A, APR_15, APR_23);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.fecha).toBe(APR_15);
    });

    it('preserves monto as bigint end-to-end', async () => {
      const row = await repo.create(
        makeNewExpense({ businessId: BIZ_A, monto: 9_876_543n }),
      );
      const loaded = await repo.findById(row.id);
      expect(loaded?.monto).toBe(9_876_543n);
      expect(typeof loaded?.monto).toBe('bigint');
    });

    it('delete on missing id is a no-op', async () => {
      await expect(repo.delete('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).resolves.toBeUndefined();
    });
  });
}
