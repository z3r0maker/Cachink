/**
 * Shared contract for {@link ConversionRecetasRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ProductId } from '@cachink/domain';
import type { ConversionRecetasRepository, CreateConversionRecetaInput } from '@cachink/data';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const MP = '01HZ8XQN9GZJXV8AKQ5X0C7MP1' as ProductId;
const PR = '01HZ8XQN9GZJXV8AKQ5X0C7PR1' as ProductId;
const MP2 = '01HZ8XQN9GZJXV8AKQ5X0C7MP2' as ProductId;

function input(overrides: Partial<CreateConversionRecetaInput> = {}): CreateConversionRecetaInput {
  return {
    materiaPrimaId: MP,
    productoResultanteId: PR,
    cantidadOrigen: 10,
    cantidadResultante: 5,
    businessId: BIZ,
    ...overrides,
  };
}

export function describeConversionRecetasRepositoryContract(
  implName: string,
  makeRepo: () => ConversionRecetasRepository,
): void {
  describe(`ConversionRecetasRepository contract — ${implName}`, () => {
    let repo: ConversionRecetasRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('create stamps id + preserves amounts', async () => {
      const row = await repo.create(input());
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.cantidadOrigen).toBe(10);
      expect(row.cantidadResultante).toBe(5);
    });

    it('findById returns the row, null for missing/deleted', async () => {
      const row = await repo.create(input());
      expect(await repo.findById(row.id)).toEqual(row);
      await repo.delete(row.id);
      expect(await repo.findById(row.id)).toBeNull();
    });

    it('findByMateriaPrima returns recipes for the given materia prima', async () => {
      await repo.create(input({ materiaPrimaId: MP }));
      await repo.create(input({ materiaPrimaId: MP2 }));
      const rows = await repo.findByMateriaPrima(MP);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.materiaPrimaId).toBe(MP);
    });

    it('findByProductoResultante returns recipe for the given producto', async () => {
      await repo.create(input());
      const row = await repo.findByProductoResultante(PR);
      expect(row).not.toBeNull();
      expect(row?.productoResultanteId).toBe(PR);
    });

    it('findAllByBusiness lists all non-deleted recipes', async () => {
      const r1 = await repo.create(input());
      await repo.create(input({ materiaPrimaId: MP2 }));
      await repo.delete(r1.id);
      const all = await repo.findAllByBusiness(BIZ);
      expect(all).toHaveLength(1);
    });

    it('delete on missing id is a no-op', async () => {
      await expect(repo.delete('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).resolves.toBeUndefined();
    });
  });
}
