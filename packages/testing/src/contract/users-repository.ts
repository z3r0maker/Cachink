/**
 * Shared contract for {@link UsersRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId } from '@cachink/domain';
import type { UsersRepository, CreateUserInput } from '@cachink/data';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const BIZ_B = '01HZ8XQN9GZJXV8AKQ5X0C7A02' as BusinessId;

function input(overrides: Partial<CreateUserInput> = {}): CreateUserInput {
  return {
    nombre: 'Juan Director',
    email: null,
    pinHash: '$2a$10$hash',
    recoveryPasswordHash: '$2a$10$pin',
    role: 'director',
    mustChangePin: false,
    avatarColor: 'blue',
    businessId: BIZ,
    ...overrides,
  };
}

export function describeUsersRepositoryContract(
  implName: string,
  makeRepo: () => UsersRepository,
): void {
  describe(`UsersRepository contract — ${implName}`, () => {
    let repo: UsersRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('create stamps id + audit fields', async () => {
      const row = await repo.create(input());
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.nombre).toBe('Juan Director');
      expect(row.role).toBe('director');
      expect(row.deletedAt).toBeNull();
    });

    it('findById returns the row, null for missing/deleted', async () => {
      const row = await repo.create(input());
      expect(await repo.findById(row.id)).toEqual(row);
      await repo.delete(row.id);
      expect(await repo.findById(row.id)).toBeNull();
    });

    it('findByNombre matches case-insensitively within business', async () => {
      await repo.create(input({ nombre: 'María López' }));
      expect(await repo.findByNombre('maría lópez', BIZ)).not.toBeNull();
      expect(await repo.findByNombre('María López', BIZ_B)).toBeNull();
    });

    it('findAllByBusiness lists users sorted by nombre', async () => {
      await repo.create(input({ nombre: 'Zoe' }));
      await repo.create(input({ nombre: 'Ana' }));
      await repo.create(input({ nombre: 'María', businessId: BIZ_B }));
      const rows = await repo.findAllByBusiness(BIZ);
      expect(rows).toHaveLength(2);
      expect(rows[0]!.nombre).toBe('Ana');
      expect(rows[1]!.nombre).toBe('Zoe');
    });

    it('update patches fields and bumps updatedAt', async () => {
      const row = await repo.create(input());
      const updated = await repo.update(row.id, { nombre: 'Nuevo' });
      expect(updated.nombre).toBe('Nuevo');
      expect(updated.updatedAt >= row.updatedAt).toBe(true);
    });

    it('delete soft-deletes and excludes from queries', async () => {
      const row = await repo.create(input());
      await repo.delete(row.id);
      expect(await repo.findById(row.id)).toBeNull();
      expect(await repo.findAllByBusiness(BIZ)).toHaveLength(0);
    });

    it('countDirectors counts only directors for the business', async () => {
      await repo.create(input({ role: 'director' }));
      await repo.create(input({ role: 'operativo' }));
      await repo.create(input({ role: 'director', businessId: BIZ_B }));
      expect(await repo.countDirectors(BIZ)).toBe(1);
    });
  });
}
