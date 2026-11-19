/**
 * Shared contract for {@link ExpenseReceiptsRepository} implementations
 * (M-18, ADR-149): insert only, the newest row per gasto is its receipt, and
 * the Gastos list asks which of its gastos have one.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, DeviceId, ExpenseId, NewExpenseReceipt } from '@xangarro/domain';
import type { ExpenseReceiptsRepository } from '@xangarro/data';
import { TEST_DEVICE_ID } from './_shared.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const HIELO = '01HZ8XQN9GZJXV8AKQ5X0C7GS1' as ExpenseId;
const GAS = '01HZ8XQN9GZJXV8AKQ5X0C7GS2' as ExpenseId;
const RENTA = '01HZ8XQN9GZJXV8AKQ5X0C7GS3' as ExpenseId;

/** A small receipt row (the repository does not decode the bytes). */
function receipt(gastoId: ExpenseId, fill = 'A'): NewExpenseReceipt {
  return { gastoId, bytes: fill.repeat(40), width: 768, height: 1024, businessId: BIZ };
}

/**
 * `deviceId` is the device the implementation stamps on the rows it creates:
 * {@link TEST_DEVICE_ID} for the phone's repositories under test.
 */
export function describeExpenseReceiptsRepositoryContract(
  implName: string,
  makeRepo: () => ExpenseReceiptsRepository,
  deviceId: DeviceId = TEST_DEVICE_ID,
): void {
  describe(`ExpenseReceiptsRepository contract — ${implName}`, () => {
    let repo: ExpenseReceiptsRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('create stamps the id, the device, the mime and the audit columns', async () => {
      const row = await repo.create(receipt(HIELO));
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.mime).toBe('image/webp');
      expect(row.deviceId).toBe(deviceId);
      expect(row.businessId).toBe(BIZ);
      expect(row.createdAt).toBe(row.updatedAt);
      expect(row.deletedAt).toBeNull();
      expect(await repo.findLatestByGasto(HIELO)).toEqual(row);
    });

    it('keeps the bytes exactly as given, base64 text', async () => {
      const bytes = 'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
      await repo.create({ ...receipt(HIELO), bytes });
      expect((await repo.findLatestByGasto(HIELO))?.bytes).toBe(bytes);
    });

    it('findLatestByGasto is null for a gasto that never had a receipt', async () => {
      await repo.create(receipt(HIELO));
      expect(await repo.findLatestByGasto(GAS)).toBeNull();
    });

    it('when a gasto has two rows, the newer one is its receipt', async () => {
      await repo.create(receipt(HIELO, 'A'));
      const second = await repo.create(receipt(HIELO, 'B'));
      expect((await repo.findLatestByGasto(HIELO))?.id).toBe(second.id);
    });

    it('findGastosWithReceipt answers only for the gastos asked about', async () => {
      await repo.create(receipt(HIELO));
      await repo.create(receipt(HIELO, 'B'));
      await repo.create(receipt(RENTA));
      const con = await repo.findGastosWithReceipt([HIELO, GAS]);
      expect([...con]).toEqual([HIELO]);
    });

    it('findGastosWithReceipt of no gastos is empty', async () => {
      await repo.create(receipt(HIELO));
      expect((await repo.findGastosWithReceipt([])).size).toBe(0);
    });
  });
}
