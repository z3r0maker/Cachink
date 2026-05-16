/**
 * Shared contract for {@link EntregasCreditoRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ClientId } from '@cachink/domain';
import type { EntregasCreditoRepository, CreateEntregaCreditoInput } from '@cachink/data';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const CLIENT_A = '01HZ8XQN9GZJXV8AKQ5X0C7CL1' as ClientId;
const CLIENT_B = '01HZ8XQN9GZJXV8AKQ5X0C7CL2' as ClientId;

function input(overrides: Partial<CreateEntregaCreditoInput> = {}): CreateEntregaCreditoInput {
  return {
    clienteId: CLIENT_A,
    fecha: '2026-05-09',
    totalCentavos: 50000n,
    nota: null,
    saleIds: '["01HZ8XQN9GZJXV8AKQ5X0C7S01"]',
    businessId: BIZ,
    ...overrides,
  };
}

export function describeEntregasCreditoRepositoryContract(
  implName: string,
  makeRepo: () => EntregasCreditoRepository,
): void {
  describe(`EntregasCreditoRepository contract — ${implName}`, () => {
    let repo: EntregasCreditoRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('create stamps id + preserves amounts', async () => {
      const row = await repo.create(input());
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.totalCentavos).toBe(50000n);
      expect(row.clienteId).toBe(CLIENT_A);
    });

    it('findById returns the row, null for missing', async () => {
      const row = await repo.create(input());
      expect(await repo.findById(row.id)).toEqual(row);
      expect(await repo.findById('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).toBeNull();
    });

    it('findByClient returns entregas for that client only', async () => {
      await repo.create(input({ clienteId: CLIENT_A }));
      await repo.create(input({ clienteId: CLIENT_B }));
      const rows = await repo.findByClient(CLIENT_A);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.clienteId).toBe(CLIENT_A);
    });

    it('findByBusiness lists all entregas for the business', async () => {
      await repo.create(input());
      await repo.create(input({ clienteId: CLIENT_B }));
      const rows = await repo.findByBusiness(BIZ);
      expect(rows).toHaveLength(2);
    });

    it('preserves nota when provided', async () => {
      const row = await repo.create(input({ nota: 'Pago parcial' }));
      expect((await repo.findById(row.id))?.nota).toBe('Pago parcial');
    });
  });
}
