/**
 * Shared contract for {@link ClientsRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId } from '@cachink/domain';
import type { ClientsRepository } from '@cachink/data';
import { makeNewClient } from '../fixtures/client.js';

const BIZ_A = '01HZ8XQN9GZJXV8AKQ5X0C7A01' as BusinessId;
const BIZ_B = '01HZ8XQN9GZJXV8AKQ5X0C7A02' as BusinessId;

export function describeClientsRepositoryContract(
  implName: string,
  makeRepo: () => ClientsRepository,
): void {
  describe(`ClientsRepository contract — ${implName}`, () => {
    let repo: ClientsRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('stamps audit + preserves nullable telefono/email/nota', async () => {
      const row = await repo.create(
        makeNewClient({ businessId: BIZ_A, telefono: undefined }),
      );
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.telefono).toBeNull();
      expect(row.email).toBeNull();
      expect(row.nota).toBeNull();
    });

    it('findById returns row, null for missing or deleted', async () => {
      const row = await repo.create(makeNewClient({ businessId: BIZ_A }));
      expect(await repo.findById(row.id)).toEqual(row);
      await repo.delete(row.id);
      expect(await repo.findById(row.id)).toBeNull();
    });

    it('findByName matches a partial substring scoped to the business', async () => {
      await repo.create(makeNewClient({ businessId: BIZ_A, nombre: 'Laura Hernández' }));
      await repo.create(makeNewClient({ businessId: BIZ_A, nombre: 'Mario Laurent' }));
      await repo.create(makeNewClient({ businessId: BIZ_A, nombre: 'Pedro Ortiz' }));
      await repo.create(makeNewClient({ businessId: BIZ_B, nombre: 'Laura Outside' }));
      const rows = await repo.findByName('Laur', BIZ_A);
      expect(rows.map((r) => r.nombre).sort()).toEqual(['Laura Hernández', 'Mario Laurent']);
    });

    it('findByName excludes deleted rows', async () => {
      const row = await repo.create(
        makeNewClient({ businessId: BIZ_A, nombre: 'Laura Hernández' }),
      );
      await repo.delete(row.id);
      expect(await repo.findByName('Laura', BIZ_A)).toEqual([]);
    });

    it('delete on missing id is a no-op', async () => {
      await expect(repo.delete('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).resolves.toBeUndefined();
    });

    it('preserves email when provided', async () => {
      const row = await repo.create(
        makeNewClient({ businessId: BIZ_A, email: 'laura@example.com' }),
      );
      expect((await repo.findById(row.id))?.email).toBe('laura@example.com');
    });
  });
}
