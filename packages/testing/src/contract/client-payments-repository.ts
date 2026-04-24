/**
 * Shared contract for {@link ClientPaymentsRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { SaleId } from '@cachink/domain';
import type { ClientPaymentsRepository } from '@cachink/data';
import { makeNewClientPayment } from '../fixtures/client.js';

const VENTA_X = '01HZ8XQN9GZJXV8AKQ5X0C7V01' as SaleId;
const VENTA_Y = '01HZ8XQN9GZJXV8AKQ5X0C7V02' as SaleId;

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
  });
}
