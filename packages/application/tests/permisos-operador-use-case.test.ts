import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { UserPatch, UsersRepository } from '@xangarro/data';
import {
  OperatorNotFoundError,
  PermisosNoIncluidosError,
  type BusinessId,
  type User,
  type UserId,
} from '@xangarro/domain';

import { CambiarPermisosOperadorUseCase } from '../src/operadores/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const OP = '01HZ8XQN9GZJXV8AKQ5X0OPR01' as UserId;

function users(owner: BusinessId | null) {
  const patches: UserPatch[] = [];
  const repo: Pick<UsersRepository, 'findById' | 'update'> = {
    findById: async () => (owner === null ? null : ({ id: OP, businessId: owner } as User)),
    update: async (_id, p) => {
      patches.push(p);
      return {} as User;
    },
  };
  return { repo, patches };
}

const run = (u: ReturnType<typeof users>, incluidoEnPlan = true) =>
  new CambiarPermisosOperadorUseCase(u.repo).execute({
    businessId: BIZ,
    operatorId: OP,
    permisos: { canCancelSales: true },
    incluidoEnPlan,
  });

describe('CambiarPermisosOperadorUseCase', () => {
  it('stores the permissions for an operator of this business', async () => {
    const u = users(BIZ);
    await run(u);
    assert.deepEqual(u.patches, [{ permissions: { canCancelSales: true } }]);
  });

  it('refuses below the plan that includes permissions', async () => {
    const u = users(BIZ);
    await assert.rejects(run(u, false), PermisosNoIncluidosError);
    assert.equal(u.patches.length, 0);
  });

  it('refuses an operator that does not exist', async () => {
    await assert.rejects(run(users(null)), OperatorNotFoundError);
  });

  it("refuses another business's operator as not found", async () => {
    const u = users('01HZ8XQN9GZJXV8AKQ5X0OTHER' as BusinessId);
    await assert.rejects(run(u), OperatorNotFoundError);
    assert.equal(u.patches.length, 0);
  });
});
