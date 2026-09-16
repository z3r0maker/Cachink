/**
 * Fullstack scenario 7 — operator sign-in against real SQLite (A-05).
 *
 * Operators arrive from the portal with a bcrypt PIN hash, an `active` flag
 * and permissions; the device only authenticates them. Covers the Drizzle
 * mapping of `active` and `permissions` end to end.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, UserId } from '@xangarro/domain';
import { newEntityId } from '@xangarro/domain';
import { makeNewBusiness } from '../../../testing/src/index.js';
import { buildHarness, type FullstackHarness } from './fullstack-harness.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER_ID = newEntityId<UserId>();
/** bcrypt("123456", 4 rounds). */
const PIN_123456_HASH = '$2b$04$evzlfJ7TAHvaDduEWaAAVOK7cs/r3lNuH5VAZ0G5Zr0DTkx1vaHa.';

describe('Operadores + Auth [fullstack]', () => {
  let h: FullstackHarness;

  beforeEach(async () => {
    h = buildHarness({ userId: USER_ID });
    await h.repos.businesses.create(makeNewBusiness({ businessId: BIZ }));
    await h.repos.users.create({
      nombre: 'Toni',
      pinHash: PIN_123456_HASH,
      avatarColor: 'blue',
      businessId: BIZ,
    });
  });

  const signIn = (nombre: string, pin: string) =>
    h.useCases.autenticarUsuario.execute({ nombre, pin, businessId: BIZ });

  it('signs in an active operator with the right PIN', async () => {
    const toni = await h.repos.users.findByNombre('Toni', BIZ);
    expect(await signIn('toni', '123456')).toEqual({ success: true, userId: toni!.id });
  });

  it('rejects a wrong PIN', async () => {
    expect((await signIn('Toni', '000000')).success).toBe(false);
  });

  it('rejects an operator deactivated in the portal', async () => {
    const toni = await h.repos.users.findByNombre('Toni', BIZ);
    await h.repos.users.update(toni!.id, { active: false });
    expect((await signIn('Toni', '123456')).success).toBe(false);
  });

  it('rejects an unknown operator', async () => {
    expect((await signIn('Nadie', '123456')).success).toBe(false);
  });

  it('round-trips portal permissions through SQLite', async () => {
    const toni = await h.repos.users.findByNombre('Toni', BIZ);
    expect(toni!.permissions).toEqual({ canCancelSales: false });
    await h.repos.users.update(toni!.id, { permissions: { canCancelSales: true } });
    expect((await h.repos.users.findById(toni!.id))!.permissions).toEqual({
      canCancelSales: true,
    });
  });
});
