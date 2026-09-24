import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * «Pedir aclaración» (O-37). A turno that is gone was once an uncoded
 * «turno no encontrado» — reported as an incident, and the owner told to
 * retry what no retry can fix. Now it is the owner's sentence.
 */

const requireMember = vi.fn();
const reportError = vi.fn();
const revalidatePath = vi.fn();
let turno: { userId: string } | undefined;
const inserted = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/observability/report', () => ({ reportError }));
vi.mock('../../src/server/repositories/portal-device', () => ({ PORTAL_DEVICE_ID: 'portal' }));
vi.mock('@xangarro/data-pg', () => ({ cajaTurnos: {}, mensajesOperador: {} }));
vi.mock('../../src/server/db', () => ({
  withTenant: (_biz: string, fn: (tx: unknown) => unknown) =>
    fn({
      select: () => ({ from: () => ({ where: async () => (turno ? [turno] : []) }) }),
      insert: () => ({ values: async (v: unknown) => inserted(v) }),
    }),
}));

const { pedirAclaracion } = await import('../../src/server/actions/cortes');

beforeEach(() => {
  vi.clearAllMocks();
  requireMember.mockResolvedValue({ business_id: 'biz-1' });
  turno = { userId: 'op-1' };
});

describe('pedirAclaracion', () => {
  it('files the message to the operator who closed the turno', async () => {
    assert.deepEqual(await pedirAclaracion('t-1', ' ¿Y los $50? '), { ok: true });
    const row = inserted.mock.calls[0]?.[0] as { operadorId: string; cuerpo: string };
    assert.equal(row.operadorId, 'op-1');
    assert.equal(row.cuerpo, '¿Y los $50?');
  });

  it('a turno that no longer exists says so, and is not an incident', async () => {
    turno = undefined;
    assert.deepEqual(await pedirAclaracion('t-gone', 'Hola'), {
      ok: false,
      message: 'Ese turno ya no existe.',
    });
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('a database failure is reported and never shown in its own words', async () => {
    const outage = new Error('insert or update on table violates foreign key constraint');
    inserted.mockRejectedValue(outage);
    assert.deepEqual(await pedirAclaracion('t-1', 'Hola'), {
      ok: false,
      message: 'No se pudo pedir la aclaración. Intenta de nuevo.',
    });
    assert.deepEqual(reportError.mock.calls, [[outage, { endpoint: 'pedirAclaracion' }]]);
  });

  it('a member without the role is told why, and it is not an incident', async () => {
    requireMember.mockRejectedValue(
      Object.assign(new Error('Solo el dueño o un admin.'), { code: 'NOT_PERMITTED' }),
    );
    assert.deepEqual(await pedirAclaracion('t-1', 'Hola'), {
      ok: false,
      message: 'Solo el dueño o un admin.',
    });
    assert.equal(reportError.mock.calls.length, 0);
  });
});
