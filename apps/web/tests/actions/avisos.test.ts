import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * The bell's actions (P-31): «Marcar todo como leído» and one aviso's state.
 * Both once let an error's own text through — any Error on the first, any
 * TypeError on the second — so a database failure or a bug reached the owner
 * in its own words. Pinned: the owner's refusals are shown, the rest reported.
 */

const requireMember = vi.fn();
const reportError = vi.fn();
const revalidatePath = vi.fn();
let row: { state: string } | undefined;
let marked: () => Promise<{ id: string }[]>;
const updated = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/session', () => ({ readSession: vi.fn() }));
vi.mock('../../src/server/observability/report', () => ({ reportError }));
vi.mock('@xangarro/data-pg', () => ({ listNotices: vi.fn(), notices: {} }));
vi.mock('../../src/server/db', () => ({
  withTenant: (_biz: string, fn: (tx: unknown) => unknown) =>
    fn({
      select: () => ({ from: () => ({ where: async () => (row ? [row] : []) }) }),
      update: () => ({
        set: (v: unknown) => ({
          where: () => Object.assign(Promise.resolve(updated(v)), { returning: () => marked() }),
        }),
      }),
    }),
}));

const { marcarAvisosLeidos, cambiarEstadoAviso } = await import('../../src/server/actions/avisos');

const RETRY_CAMBIO = 'No pudimos guardar el cambio. Intenta de nuevo.';

beforeEach(() => {
  vi.clearAllMocks();
  requireMember.mockResolvedValue({ business_id: 'biz-1' });
  row = { state: 'nuevo' };
  marked = async () => [{ id: 'n-1' }, { id: 'n-2' }];
});

describe('marcarAvisosLeidos', () => {
  it('marks the unread avisos and refreshes the bell', async () => {
    assert.deepEqual(await marcarAvisosLeidos(), { ok: true, marked: 2 });
    assert.deepEqual(revalidatePath.mock.calls, [['/avisos'], ['/']]);
  });

  it('a database failure is reported and never shown in its own words', async () => {
    const outage = new Error('relation "notices" does not exist');
    marked = async () => {
      throw outage;
    };
    assert.deepEqual(await marcarAvisosLeidos(), {
      ok: false,
      message: 'No pudimos marcar los avisos. Intenta de nuevo.',
    });
    assert.deepEqual(reportError.mock.calls, [[outage, { endpoint: 'marcarAvisosLeidos' }]]);
  });

  it('a member without the role is told why, and it is not an incident', async () => {
    requireMember.mockRejectedValue(
      Object.assign(new Error('Solo el dueño o un admin.'), { code: 'NOT_PERMITTED' }),
    );
    assert.deepEqual(await marcarAvisosLeidos(), {
      ok: false,
      message: 'Solo el dueño o un admin.',
    });
    assert.equal(reportError.mock.calls.length, 0);
  });
});

describe('cambiarEstadoAviso', () => {
  it('moves the aviso through its lifecycle', async () => {
    assert.deepEqual(await cambiarEstadoAviso('n-1', 'descartar'), { ok: true });
    assert.equal((updated.mock.calls[0]?.[0] as { state: string }).state, 'descartado');
  });

  it('an aviso that no longer exists says so, and is not an incident', async () => {
    row = undefined;
    assert.deepEqual(await cambiarEstadoAviso('n-gone', 'descartar'), {
      ok: false,
      message: 'Ese aviso ya no existe.',
    });
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('a transition the domain refuses is shown', async () => {
    row = { state: 'descartado' };
    assert.deepEqual(await cambiarEstadoAviso('n-1', 'leer'), {
      ok: false,
      message: 'Ese aviso ya está cerrado.',
    });
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('a real TypeError is a bug: reported, and never shown in its own words', async () => {
    const bug = new TypeError("Cannot read properties of undefined (reading 'state')");
    requireMember.mockRejectedValue(bug);
    assert.deepEqual(await cambiarEstadoAviso('n-1', 'descartar'), {
      ok: false,
      message: RETRY_CAMBIO,
    });
    assert.deepEqual(reportError.mock.calls[0], [bug, { endpoint: 'cambiarEstadoAviso' }]);
  });
});
