/**
 * Shared contract for {@link BusinessesRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessesRepository } from '@cachink/data';
import { makeNewBusiness } from '../fixtures/business.js';
import { TEST_DEVICE_ID } from './_shared.js';

export function describeBusinessesRepositoryContract(
  implName: string,
  makeRepo: () => BusinessesRepository,
): void {
  describe(`BusinessesRepository contract — ${implName}`, () => {
    let repo: BusinessesRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('stamps id + audit columns on create; row.businessId === row.id', async () => {
      const row = await repo.create(makeNewBusiness());
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.businessId).toBe(row.id);
      expect(row.deviceId).toBe(TEST_DEVICE_ID);
      expect(row.deletedAt).toBeNull();
    });

    it('findById / findCurrent return the same persisted row', async () => {
      const row = await repo.create(makeNewBusiness({ nombre: 'La Michoacana' }));
      expect(await repo.findById(row.id)).toEqual(row);
      expect(await repo.findCurrent(row.id)).toEqual(row);
    });

    it('findById returns null for missing and soft-deleted rows', async () => {
      const row = await repo.create(makeNewBusiness());
      await repo.delete(row.id);
      expect(await repo.findById(row.id)).toBeNull();
      expect(await repo.findCurrent(row.id)).toBeNull();
      expect(await repo.findById('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).toBeNull();
    });

    it('delete on missing id is a no-op', async () => {
      await expect(repo.delete('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).resolves.toBeUndefined();
    });

    it('preserves isrTasa as a plain number (not bigint)', async () => {
      const row = await repo.create(makeNewBusiness({ isrTasa: 0.25 }));
      const loaded = await repo.findById(row.id);
      expect(loaded?.isrTasa).toBeCloseTo(0.25, 10);
      expect(typeof loaded?.isrTasa).toBe('number');
    });

    it('accepts logoUrl null and non-null round-trips', async () => {
      const a = await repo.create(makeNewBusiness({ logoUrl: null }));
      const b = await repo.create(
        makeNewBusiness({
          logoUrl: 'https://cachink.mx/logo.png',
        }),
      );
      expect((await repo.findById(a.id))?.logoUrl).toBeNull();
      expect((await repo.findById(b.id))?.logoUrl).toBe('https://cachink.mx/logo.png');
    });
  });
}
