/**
 * Shared contract for {@link InventoryMovementsRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, IsoDate, ProductId } from '@cachink/domain';
import type { InventoryMovementsRepository } from '@cachink/data';
import { makeNewInventoryMovement } from '../fixtures/inventory-movement.js';

const BIZ_A = '01HZ8XQN9GZJXV8AKQ5X0C7A01' as BusinessId;
const BIZ_B = '01HZ8XQN9GZJXV8AKQ5X0C7A02' as BusinessId;
const PROD_X = '01HZ8XQN9GZJXV8AKQ5X0C7P01' as ProductId;
const PROD_Y = '01HZ8XQN9GZJXV8AKQ5X0C7P02' as ProductId;
const APR_10 = '2026-04-10' as IsoDate;
const APR_23 = '2026-04-23' as IsoDate;
const MAY_01 = '2026-05-01' as IsoDate;

export function describeInventoryMovementsRepositoryContract(
  implName: string,
  makeRepo: () => InventoryMovementsRepository,
): void {
  describe(`InventoryMovementsRepository contract — ${implName}`, () => {
    let repo: InventoryMovementsRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('stamps audit and preserves nullable nota', async () => {
      const row = await repo.create(
        makeNewInventoryMovement({ businessId: BIZ_A, productoId: PROD_X }),
      );
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.nota).toBeNull();
      expect(row.deletedAt).toBeNull();
    });

    it('findById returns the row, null for missing or deleted', async () => {
      const row = await repo.create(
        makeNewInventoryMovement({ businessId: BIZ_A, productoId: PROD_X }),
      );
      expect(await repo.findById(row.id)).toEqual(row);
      await repo.delete(row.id);
      expect(await repo.findById(row.id)).toBeNull();
    });

    it('findByProduct scopes only to that productoId', async () => {
      await repo.create(makeNewInventoryMovement({ productoId: PROD_X, businessId: BIZ_A }));
      await repo.create(makeNewInventoryMovement({ productoId: PROD_Y, businessId: BIZ_A }));
      const rows = await repo.findByProduct(PROD_X);
      expect(rows.every((r) => r.productoId === PROD_X)).toBe(true);
    });

    it('findByDateRange is inclusive of endpoints, scopes businessId, excludes deleted', async () => {
      await repo.create(
        makeNewInventoryMovement({ fecha: APR_10, businessId: BIZ_A, productoId: PROD_X }),
      );
      await repo.create(
        makeNewInventoryMovement({ fecha: APR_23, businessId: BIZ_A, productoId: PROD_X }),
      );
      await repo.create(
        makeNewInventoryMovement({ fecha: MAY_01, businessId: BIZ_A, productoId: PROD_X }),
      );
      await repo.create(
        makeNewInventoryMovement({ fecha: APR_23, businessId: BIZ_B, productoId: PROD_X }),
      );
      const rows = await repo.findByDateRange(APR_10, APR_23, BIZ_A);
      expect(rows).toHaveLength(2);
      expect(rows.every((r) => r.businessId === BIZ_A)).toBe(true);
    });

    it('sumStock returns entradas minus salidas for a single product', async () => {
      await repo.create(
        makeNewInventoryMovement({
          productoId: PROD_X,
          tipo: 'entrada',
          cantidad: 10,
          motivo: 'Compra a proveedor',
        }),
      );
      await repo.create(
        makeNewInventoryMovement({
          productoId: PROD_X,
          tipo: 'salida',
          cantidad: 3,
          motivo: 'Venta',
        }),
      );
      await repo.create(
        makeNewInventoryMovement({
          productoId: PROD_Y,
          tipo: 'entrada',
          cantidad: 999,
          motivo: 'Compra a proveedor',
        }),
      );
      expect(await repo.sumStock(PROD_X)).toBe(7);
      expect(await repo.sumStock(PROD_Y)).toBe(999);
    });

    it('sumStock is 0 for a product with no movements', async () => {
      expect(await repo.sumStock('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as ProductId)).toBe(0);
    });

    it('preserves costoUnitCentavos as bigint', async () => {
      const row = await repo.create(
        makeNewInventoryMovement({
          productoId: PROD_X,
          costoUnitCentavos: 9_999n,
        }),
      );
      expect(typeof row.costoUnitCentavos).toBe('bigint');
      expect((await repo.findById(row.id))?.costoUnitCentavos).toBe(9_999n);
    });

    it('delete on missing id is a no-op', async () => {
      await expect(repo.delete('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).resolves.toBeUndefined();
    });
  });
}
