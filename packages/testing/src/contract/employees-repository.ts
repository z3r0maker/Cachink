/**
 * Shared contract for {@link EmployeesRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId } from '@cachink/domain';
import type { EmployeesRepository } from '@cachink/data';
import { makeNewEmployee } from '../fixtures/employee.js';

const BIZ_A = '01HZ8XQN9GZJXV8AKQ5X0C7A01' as BusinessId;
const BIZ_B = '01HZ8XQN9GZJXV8AKQ5X0C7A02' as BusinessId;

export function describeEmployeesRepositoryContract(
  implName: string,
  makeRepo: () => EmployeesRepository,
): void {
  describe(`EmployeesRepository contract — ${implName}`, () => {
    let repo: EmployeesRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('stamps audit on create', async () => {
      const row = await repo.create(makeNewEmployee({ businessId: BIZ_A }));
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.deletedAt).toBeNull();
    });

    it('findById returns row, null for missing or deleted', async () => {
      const row = await repo.create(makeNewEmployee({ businessId: BIZ_A }));
      expect(await repo.findById(row.id)).toEqual(row);
      await repo.delete(row.id);
      expect(await repo.findById(row.id)).toBeNull();
    });

    it('listActive returns per-business, nombre asc, excludes deleted', async () => {
      await repo.create(makeNewEmployee({ businessId: BIZ_A, nombre: 'Beto Rodríguez' }));
      await repo.create(makeNewEmployee({ businessId: BIZ_A, nombre: 'Ana Lopez' }));
      const drop = await repo.create(
        makeNewEmployee({ businessId: BIZ_A, nombre: 'Zacarías' }),
      );
      await repo.delete(drop.id);
      await repo.create(makeNewEmployee({ businessId: BIZ_B, nombre: 'Outside' }));
      const rows = await repo.listActive(BIZ_A);
      expect(rows.map((r) => r.nombre)).toEqual(['Ana Lopez', 'Beto Rodríguez']);
    });

    it('preserves salarioCentavos as bigint', async () => {
      const row = await repo.create(
        makeNewEmployee({ businessId: BIZ_A, salarioCentavos: 8_765_432n }),
      );
      expect(typeof row.salarioCentavos).toBe('bigint');
      expect((await repo.findById(row.id))?.salarioCentavos).toBe(8_765_432n);
    });

    it('persists periodo enum values', async () => {
      const row = await repo.create(
        makeNewEmployee({ businessId: BIZ_A, periodo: 'mensual' }),
      );
      expect((await repo.findById(row.id))?.periodo).toBe('mensual');
    });

    it('delete on missing id is a no-op', async () => {
      await expect(repo.delete('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).resolves.toBeUndefined();
    });
  });
}
