/**
 * Shared contract for {@link ConversionsRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ConversionRecetaId } from '@cachink/domain';
import type { ConversionsRepository, CreateConversionInput } from '@cachink/data';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const BIZ_B = '01HZ8XQN9GZJXV8AKQ5X0C7A02' as BusinessId;
const RECETA = '01HZ8XQN9GZJXV8AKQ5X0C7RCP' as ConversionRecetaId;

function input(overrides: Partial<CreateConversionInput> = {}): CreateConversionInput {
  return {
    recetaId: RECETA,
    materiaPrimaId: '01HZ8XQN9GZJXV8AKQ5X0C7MP1',
    productoResultanteId: '01HZ8XQN9GZJXV8AKQ5X0C7PR1',
    cantidadOrigenUsada: 10,
    cantidadResultanteCreada: 5,
    movimientoSalidaId: '01HZ8XQN9GZJXV8AKQ5X0C7MS1',
    movimientoEntradaId: '01HZ8XQN9GZJXV8AKQ5X0C7ME1',
    businessId: BIZ,
    ...overrides,
  };
}

export function describeConversionsRepositoryContract(
  implName: string,
  makeRepo: () => ConversionsRepository,
): void {
  describe(`ConversionsRepository contract — ${implName}`, () => {
    let repo: ConversionsRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('create stamps id + preserves quantities', async () => {
      const row = await repo.create(input());
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.cantidadOrigenUsada).toBe(10);
      expect(row.cantidadResultanteCreada).toBe(5);
      expect(row.recetaId).toBe(RECETA);
    });

    it('findById returns the row, null for missing', async () => {
      const row = await repo.create(input());
      expect(await repo.findById(row.id)).toEqual(row);
      expect(await repo.findById('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).toBeNull();
    });

    it('findByBusiness lists conversions scoped to the business', async () => {
      await repo.create(input());
      await repo.create(input({ businessId: BIZ_B }));
      const rows = await repo.findByBusiness(BIZ);
      expect(rows).toHaveLength(1);
    });
  });
}
