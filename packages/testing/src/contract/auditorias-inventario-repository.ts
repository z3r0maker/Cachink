/**
 * Shared contract for {@link AuditoriasInventarioRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId } from '@cachink/domain';
import type { AuditoriasInventarioRepository, CreateAuditoriaInput } from '@cachink/data';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function input(overrides: Partial<CreateAuditoriaInput> = {}): CreateAuditoriaInput {
  return {
    fecha: '2026-05-09',
    lineas: '[]',
    totalProductos: 10,
    businessId: BIZ,
    ...overrides,
  };
}

export function describeAuditoriasInventarioRepositoryContract(
  implName: string,
  makeRepo: () => AuditoriasInventarioRepository,
): void {
  describe(`AuditoriasInventarioRepository contract — ${implName}`, () => {
    let repo: AuditoriasInventarioRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('create stamps id + defaults estado to borrador', async () => {
      const row = await repo.create(input());
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.estado).toBe('borrador');
      expect(row.totalProductos).toBe(10);
    });

    it('findById returns the row, null for missing', async () => {
      const row = await repo.create(input());
      expect(await repo.findById(row.id)).toEqual(row);
      expect(await repo.findById('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).toBeNull();
    });

    it('findLatest returns a non-null result when auditorias exist', async () => {
      await repo.create(input({ fecha: '2026-05-07' }));
      await repo.create(input({ fecha: '2026-05-09' }));
      const latest = await repo.findLatest(BIZ);
      expect(latest).not.toBeNull();
      expect(latest!.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    });

    it('findByDateRange returns auditorias within range', async () => {
      await repo.create(input({ fecha: '2026-05-01' }));
      await repo.create(input({ fecha: '2026-05-09' }));
      const rows = await repo.findByDateRange('2026-05-08', '2026-05-10', BIZ);
      expect(rows).toHaveLength(1);
    });

    it('update patches estado and productosContados', async () => {
      const row = await repo.create(input());
      const updated = await repo.update(row.id, {
        estado: 'finalizada',
        productosContados: 8,
        totalDiscrepancias: 2,
      });
      expect(updated.estado).toBe('finalizada');
      expect(updated.productosContados).toBe(8);
      expect(updated.totalDiscrepancias).toBe(2);
    });
  });
}
