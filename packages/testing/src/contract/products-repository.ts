/**
 * Shared contract for {@link ProductsRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId } from '@cachink/domain';
import type { ProductsRepository } from '@cachink/data';
import { makeNewProduct } from '../fixtures/product.js';
import { TEST_DEVICE_ID } from './_shared.js';

const BIZ_A = '01HZ8XQN9GZJXV8AKQ5X0C7A01' as BusinessId;
const BIZ_B = '01HZ8XQN9GZJXV8AKQ5X0C7A02' as BusinessId;

export function describeProductsRepositoryContract(
  implName: string,
  makeRepo: () => ProductsRepository,
): void {
  describe(`ProductsRepository contract — ${implName}`, () => {
    let repo: ProductsRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('stamps audit and defaults umbralStockBajo to 3 when not supplied', async () => {
      const row = await repo.create(
        makeNewProduct({ businessId: BIZ_A, umbralStockBajo: undefined }),
      );
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.umbralStockBajo).toBe(3);
      expect(row.deviceId).toBe(TEST_DEVICE_ID);
    });

    it('honours an explicit umbralStockBajo', async () => {
      const row = await repo.create(makeNewProduct({ businessId: BIZ_A, umbralStockBajo: 10 }));
      expect(row.umbralStockBajo).toBe(10);
    });

    it('findById returns the row, null for missing or deleted', async () => {
      const row = await repo.create(makeNewProduct({ businessId: BIZ_A }));
      expect(await repo.findById(row.id)).toEqual(row);
      await repo.delete(row.id);
      expect(await repo.findById(row.id)).toBeNull();
    });

    it('findBySku scopes by businessId and returns null on miss', async () => {
      await repo.create(makeNewProduct({ businessId: BIZ_A, sku: 'HAR-001' }));
      await repo.create(makeNewProduct({ businessId: BIZ_B, sku: 'HAR-001' }));
      const aRow = await repo.findBySku('HAR-001', BIZ_A);
      expect(aRow?.businessId).toBe(BIZ_A);
      expect(await repo.findBySku('MISSING', BIZ_A)).toBeNull();
    });

    it('listForBusiness returns only that businessId, orders by nombre asc, excludes deleted', async () => {
      await repo.create(
        makeNewProduct({ businessId: BIZ_A, nombre: 'Azúcar 1kg', sku: 'AZU-001' }),
      );
      await repo.create(
        makeNewProduct({ businessId: BIZ_A, nombre: 'Harina 1kg', sku: 'HAR-001' }),
      );
      const otherBiz = await repo.create(
        makeNewProduct({ businessId: BIZ_B, nombre: 'Maíz', sku: 'MAI-001' }),
      );
      const drop = await repo.create(
        makeNewProduct({ businessId: BIZ_A, nombre: 'Zucaritas', sku: 'ZUC-001' }),
      );
      await repo.delete(drop.id);

      const rows = await repo.listForBusiness(BIZ_A);
      expect(rows.map((r) => r.nombre)).toEqual(['Azúcar 1kg', 'Harina 1kg']);
      expect(rows.some((r) => r.id === otherBiz.id)).toBe(false);
    });

    it('preserves costoUnitCentavos as bigint end-to-end', async () => {
      const row = await repo.create(
        makeNewProduct({ businessId: BIZ_A, costoUnitCentavos: 12_345_678n }),
      );
      const loaded = await repo.findById(row.id);
      expect(loaded?.costoUnitCentavos).toBe(12_345_678n);
      expect(typeof loaded?.costoUnitCentavos).toBe('bigint');
    });

    it('delete on missing id is a no-op', async () => {
      await expect(repo.delete('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).resolves.toBeUndefined();
    });

    // Audit Round 2 J3: partial-update contract per ADR-023.
    it('update applies the patch fields and bumps updatedAt', async () => {
      const row = await repo.create(makeNewProduct({ businessId: BIZ_A, umbralStockBajo: 3 }));
      const originalUpdatedAt = row.updatedAt;
      await new Promise((r) => setTimeout(r, 5));
      const updated = await repo.update(row.id, {
        nombre: 'Café tostado oscuro',
        umbralStockBajo: 10,
      });
      expect(updated?.nombre).toBe('Café tostado oscuro');
      expect(updated?.umbralStockBajo).toBe(10);
      expect(updated && updated.updatedAt.localeCompare(originalUpdatedAt)).toBeGreaterThan(0);
    });

    it('update preserves costoUnitCentavos (excluded from the patch shape)', async () => {
      const row = await repo.create(
        makeNewProduct({ businessId: BIZ_A, costoUnitCentavos: 5000n }),
      );
      const updated = await repo.update(row.id, { nombre: 'Nuevo nombre' });
      expect(updated?.costoUnitCentavos).toBe(5000n);
    });

    it('update returns null for a missing or soft-deleted producto', async () => {
      expect(await repo.update('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never, { nombre: 'X' })).toBeNull();
      const row = await repo.create(makeNewProduct({ businessId: BIZ_A }));
      await repo.delete(row.id);
      expect(await repo.update(row.id, { nombre: 'X' })).toBeNull();
    });
  });
}
