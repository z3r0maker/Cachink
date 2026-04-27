/**
 * Shared contract for {@link ClientPaymentsRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, IsoDate, SaleId } from '@cachink/domain';
import type { ClientPaymentsRepository } from '@cachink/data';
import { makeNewClientPayment } from '../fixtures/client.js';

const VENTA_X = '01HZ8XQN9GZJXV8AKQ5X0C7V01' as SaleId;
const VENTA_Y = '01HZ8XQN9GZJXV8AKQ5X0C7V02' as SaleId;
const BIZ_A = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const BIZ_B = '01HZ8XQN9GZJXV8AKQ5X0C7BJW' as BusinessId;

export function describeClientPaymentsRepositoryContract(
  implName: string,
  makeRepo: () => ClientPaymentsRepository,
): void {
  describe(`ClientPaymentsRepository contract — ${implName}`, () => {
    let repo: ClientPaymentsRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('stamps audit on create', async () => {
      const row = await repo.create(makeNewClientPayment({ ventaId: VENTA_X }));
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.deletedAt).toBeNull();
    });

    it('findById returns row, null for missing or deleted', async () => {
      const row = await repo.create(makeNewClientPayment({ ventaId: VENTA_X }));
      expect(await repo.findById(row.id)).toEqual(row);
      await repo.delete(row.id);
      expect(await repo.findById(row.id)).toBeNull();
    });

    it('findByVenta scopes to a single sale', async () => {
      await repo.create(makeNewClientPayment({ ventaId: VENTA_X, montoCentavos: 1_000n }));
      await repo.create(makeNewClientPayment({ ventaId: VENTA_X, montoCentavos: 2_000n }));
      await repo.create(makeNewClientPayment({ ventaId: VENTA_Y, montoCentavos: 9_999n }));
      const rows = await repo.findByVenta(VENTA_X);
      expect(rows).toHaveLength(2);
      expect(rows.every((r) => r.ventaId === VENTA_X)).toBe(true);
    });

    it('sumByVenta returns the total of non-deleted pagos', async () => {
      await repo.create(makeNewClientPayment({ ventaId: VENTA_X, montoCentavos: 30_000n }));
      const drop = await repo.create(
        makeNewClientPayment({ ventaId: VENTA_X, montoCentavos: 1_000_000n }),
      );
      await repo.create(makeNewClientPayment({ ventaId: VENTA_X, montoCentavos: 70_000n }));
      await repo.delete(drop.id);
      expect(await repo.sumByVenta(VENTA_X)).toBe(100_000n);
    });

    it('sumByVenta returns 0n when no pagos exist', async () => {
      expect(await repo.sumByVenta('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as SaleId)).toBe(0n);
    });

    it('preserves montoCentavos as bigint', async () => {
      const row = await repo.create(
        makeNewClientPayment({ ventaId: VENTA_X, montoCentavos: 123_456_789n }),
      );
      expect(typeof row.montoCentavos).toBe('bigint');
      expect((await repo.findById(row.id))?.montoCentavos).toBe(123_456_789n);
    });

    it('delete on missing id is a no-op', async () => {
      await expect(repo.delete('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).resolves.toBeUndefined();
    });

    it('findByDateRange returns an empty array when no pagos fall in the window', async () => {
      await repo.create(
        makeNewClientPayment({
          ventaId: VENTA_X,
          businessId: BIZ_A,
          fecha: '2026-01-01' as IsoDate,
        }),
      );
      const rows = await repo.findByDateRange(
        '2026-05-01' as IsoDate,
        '2026-05-31' as IsoDate,
        BIZ_A,
      );
      expect(rows).toEqual([]);
    });

    it('findByDateRange includes rows on both boundary dates and scopes by business', async () => {
      const start = await repo.create(
        makeNewClientPayment({
          ventaId: VENTA_X,
          businessId: BIZ_A,
          fecha: '2026-04-20' as IsoDate,
        }),
      );
      const end = await repo.create(
        makeNewClientPayment({
          ventaId: VENTA_Y,
          businessId: BIZ_A,
          fecha: '2026-04-24' as IsoDate,
        }),
      );
      const outside = await repo.create(
        makeNewClientPayment({
          ventaId: VENTA_Y,
          businessId: BIZ_A,
          fecha: '2026-04-19' as IsoDate,
        }),
      );
      const otherBiz = await repo.create(
        makeNewClientPayment({
          ventaId: VENTA_X,
          businessId: BIZ_B,
          fecha: '2026-04-22' as IsoDate,
        }),
      );
      const rows = await repo.findByDateRange(
        '2026-04-20' as IsoDate,
        '2026-04-24' as IsoDate,
        BIZ_A,
      );
      const ids = rows.map((r) => r.id);
      expect(ids).toEqual(expect.arrayContaining([start.id, end.id]));
      expect(ids).not.toContain(outside.id);
      expect(ids).not.toContain(otherBiz.id);
    });

    it('findByDateRange returns rows sorted by fecha desc', async () => {
      const oldest = await repo.create(
        makeNewClientPayment({
          ventaId: VENTA_X,
          businessId: BIZ_A,
          fecha: '2026-04-20' as IsoDate,
        }),
      );
      const newest = await repo.create(
        makeNewClientPayment({
          ventaId: VENTA_X,
          businessId: BIZ_A,
          fecha: '2026-04-24' as IsoDate,
        }),
      );
      const rows = await repo.findByDateRange(
        '2026-04-20' as IsoDate,
        '2026-04-24' as IsoDate,
        BIZ_A,
      );
      expect(rows[0]!.id).toBe(newest.id);
      expect(rows[rows.length - 1]!.id).toBe(oldest.id);
    });
  });
}
