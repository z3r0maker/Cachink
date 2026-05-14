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

    // --- update method ---

    it('update patches nombre and sets updatedAt', async () => {
      const row = await repo.create(makeNewBusiness({ nombre: 'Original' }));
      const updated = await repo.update(row.id, { nombre: 'Nuevo Nombre' });
      expect(updated.nombre).toBe('Nuevo Nombre');
      expect(updated.regimenFiscal).toBe(row.regimenFiscal);
      expect(updated.isrTasa).toBe(row.isrTasa);
      expect(updated.updatedAt >= row.updatedAt).toBe(true);
    });

    it('update patches regimenFiscal only', async () => {
      const row = await repo.create(makeNewBusiness());
      const updated = await repo.update(row.id, { regimenFiscal: 'RESICO' });
      expect(updated.regimenFiscal).toBe('RESICO');
      expect(updated.nombre).toBe(row.nombre);
    });

    it('update patches isrTasa only', async () => {
      const row = await repo.create(makeNewBusiness({ isrTasa: 0.3 }));
      const updated = await repo.update(row.id, { isrTasa: 0.02 });
      expect(updated.isrTasa).toBeCloseTo(0.02, 10);
    });

    it('update patches multiple fields at once', async () => {
      const row = await repo.create(makeNewBusiness());
      const updated = await repo.update(row.id, {
        nombre: 'Patched',
        regimenFiscal: 'Otro',
        isrTasa: 0.15,
      });
      expect(updated.nombre).toBe('Patched');
      expect(updated.regimenFiscal).toBe('Otro');
      expect(updated.isrTasa).toBeCloseTo(0.15, 10);
    });

    it('update on missing id throws', async () => {
      await expect(
        repo.update('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never, { nombre: 'X' }),
      ).rejects.toThrow();
    });
  });
}
