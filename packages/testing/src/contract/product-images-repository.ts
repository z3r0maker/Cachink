/**
 * Shared contract for {@link ProductImagesRepository} implementations
 * (M-13, ADR-134): append-only, the newest row per product wins, a
 * tombstone is a row like any other.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, NewProductImage, ProductId } from '@xangarro/domain';
import type { ProductImagesRepository } from '@xangarro/data';
import { TEST_DEVICE_ID } from './_shared.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const OTHER_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJY' as BusinessId;
const REFRESCO = '01HZ8XQN9GZJXV8AKQ5X0C7PR1' as ProductId;
const QUESO = '01HZ8XQN9GZJXV8AKQ5X0C7PR2' as ProductId;

/** A small photo row: 30 bytes of WebP-ish base64 (the repository does not decode it). */
function photo(productoId: ProductId, fill = 'A', businessId = BIZ): NewProductImage {
  return { productoId, bytes: fill.repeat(40), width: 512, height: 512, businessId };
}

function tombstone(productoId: ProductId): NewProductImage {
  return { productoId, bytes: null, width: null, height: null, businessId: BIZ };
}

export function describeProductImagesRepositoryContract(
  implName: string,
  makeRepo: () => ProductImagesRepository,
): void {
  describe(`ProductImagesRepository contract — ${implName}`, () => {
    let repo: ProductImagesRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('create stamps the id, the device and the audit columns', async () => {
      const row = await repo.create(photo(REFRESCO));
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.mime).toBe('image/webp');
      expect(row.deviceId).toBe(TEST_DEVICE_ID);
      expect(row.createdAt).toBe(row.updatedAt);
      expect(row.deletedAt).toBeNull();
      expect(await repo.latestForProduct(REFRESCO)).toEqual(row);
    });

    it('latestForProduct is null for a product that never had a photo', async () => {
      expect(await repo.latestForProduct(QUESO)).toBeNull();
    });

    it('a replacement wins over the photo before it, even in the same millisecond', async () => {
      await repo.create(photo(REFRESCO, 'A'));
      const second = await repo.create(photo(REFRESCO, 'B'));
      const third = await repo.create(photo(REFRESCO, 'C'));
      expect(third.createdAt > second.createdAt).toBe(true);
      expect((await repo.latestForProduct(REFRESCO))?.bytes).toBe('C'.repeat(40));
    });

    it('a tombstone after a photo is the winning row', async () => {
      await repo.create(photo(REFRESCO));
      const t = await repo.create(tombstone(REFRESCO));
      const latest = await repo.latestForProduct(REFRESCO);
      expect(latest?.id).toBe(t.id);
      expect(latest?.bytes).toBeNull();
      expect(latest?.width).toBeNull();
    });

    it('latestForBusiness keeps one winner per product, only for that business', async () => {
      await repo.create(photo(REFRESCO, 'A'));
      await repo.create(photo(REFRESCO, 'B'));
      await repo.create(photo(QUESO, 'Q'));
      await repo.create(photo(REFRESCO, 'Z', OTHER_BIZ));
      const map = await repo.latestForBusiness(BIZ);
      expect(map.size).toBe(2);
      expect(map.get(REFRESCO)?.bytes).toBe('B'.repeat(40));
      expect(map.get(QUESO)?.bytes).toBe('Q'.repeat(40));
      expect((await repo.latestForBusiness(OTHER_BIZ)).get(REFRESCO)?.bytes).toBe('Z'.repeat(40));
    });
  });
}
