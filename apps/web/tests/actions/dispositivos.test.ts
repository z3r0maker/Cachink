import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * «Revocar» (B-12). The catch once returned any Error's own message, so a
 * database failure put the database's words on the owner's screen — and a
 * member without the role was reported as an incident. Pinned both ways.
 */

const requireMember = vi.fn();
const reportError = vi.fn();
const revalidatePath = vi.fn();
let revoked: () => Promise<{ id: string }[]>;

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/observability/report', () => ({ reportError }));
vi.mock('@xangarro/data-pg', () => ({ devices: {} }));
vi.mock('../../src/server/db', () => ({
  withTenant: (_biz: string, fn: (tx: unknown) => unknown) =>
    fn({ update: () => ({ set: () => ({ where: () => ({ returning: () => revoked() }) }) }) }),
}));

const { revocarDispositivo } = await import('../../src/server/actions/dispositivos');

beforeEach(() => {
  vi.clearAllMocks();
  requireMember.mockResolvedValue({ business_id: 'biz-1' });
  revoked = async () => [{ id: 'dev-1' }];
});

describe('revocarDispositivo', () => {
  it('revokes the device and refreshes Equipo', async () => {
    assert.deepEqual(await revocarDispositivo('dev-1'), { ok: true });
    assert.deepEqual(revalidatePath.mock.calls, [['/equipo']]);
  });

  it('a device already revoked, or gone, says so', async () => {
    revoked = async () => [];
    assert.deepEqual(await revocarDispositivo('dev-1'), {
      ok: false,
      message: 'Ese dispositivo ya estaba revocado o no existe.',
    });
  });

  it('a database failure is reported and never shown in its own words', async () => {
    const outage = new Error('canceling statement due to statement timeout');
    revoked = async () => {
      throw outage;
    };
    assert.deepEqual(await revocarDispositivo('dev-1'), {
      ok: false,
      message: 'No pudimos revocar el dispositivo. Intenta de nuevo.',
    });
    assert.deepEqual(reportError.mock.calls, [[outage, { endpoint: 'revocarDispositivo' }]]);
  });

  it('a member without the role is told why, and it is not an incident', async () => {
    requireMember.mockRejectedValue(
      Object.assign(new Error('Solo el dueño o un admin.'), { code: 'NOT_PERMITTED' }),
    );
    assert.deepEqual(await revocarDispositivo('dev-1'), {
      ok: false,
      message: 'Solo el dueño o un admin.',
    });
    assert.equal(reportError.mock.calls.length, 0);
  });
});
