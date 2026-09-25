import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * The Asesor's own actions (P-26, P-32): closing one of its avisos, and the
 * month's figures for «Compartir diagnóstico». What matters beyond the E2E
 * happy paths is which failures are the owner's to read and which are bugs
 * to report — a TypeError is a bug, whatever the code once used it for.
 */

const requireMember = vi.fn();
const readSession = vi.fn();
const reportError = vi.fn();
const revalidatePath = vi.fn();
const loadEstadosModel = vi.fn();
const getBusiness = vi.fn();
let row: { state: string } | undefined;
const updated = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/session', () => ({ readSession }));
vi.mock('../../src/server/clock', () => ({ hoy: () => '2026-05-12' }));
vi.mock('../../src/server/estados', () => ({ loadEstadosModel }));
vi.mock('../../src/server/observability/report', () => ({ reportError }));
vi.mock('@xangarro/data-pg', () => ({ getBusiness, notices: {} }));
vi.mock('../../src/server/db', () => ({
  withTenant: (_biz: string, fn: (tx: unknown) => unknown) =>
    fn({
      select: () => ({ from: () => ({ where: async () => (row ? [row] : []) }) }),
      update: () => ({ set: (v: unknown) => ({ where: async () => updated(v) }) }),
    }),
}));

const { cerrarAvisoAsesor, resumenParaCompartir } = await import('../../src/server/actions/asesor');

beforeEach(() => {
  vi.clearAllMocks();
  requireMember.mockResolvedValue({ business_id: 'biz-1' });
  row = { state: 'nuevo' };
});

describe('cerrarAvisoAsesor', () => {
  it('moves the aviso through its lifecycle and refreshes the Asesor', async () => {
    assert.deepEqual(await cerrarAvisoAsesor('n-1', 'descartar'), { ok: true });
    const set = updated.mock.calls[0]?.[0] as { state: string; resolvedAt?: string };
    assert.equal(set.state, 'descartado');
    assert.ok(set.resolvedAt !== undefined, 'a closed aviso records when');
    assert.deepEqual(revalidatePath.mock.calls, [['/asesor']]);
  });

  it('an aviso that no longer exists says so, and is not an incident', async () => {
    row = undefined;
    assert.deepEqual(await cerrarAvisoAsesor('n-gone', 'descartar'), {
      ok: false,
      message: 'Ese aviso ya no existe.',
    });
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('a real TypeError is a bug: reported, and never shown in its own words', async () => {
    const bug = new TypeError("Cannot read properties of undefined (reading 'state')");
    requireMember.mockRejectedValue(bug);
    assert.deepEqual(await cerrarAvisoAsesor('n-1', 'descartar'), {
      ok: false,
      message: 'No pudimos guardar el cambio. Intenta de nuevo.',
    });
    assert.deepEqual(reportError.mock.calls[0], [bug, { endpoint: 'cerrarAvisoAsesor' }]);
  });

  it('a member without the role is told why', async () => {
    requireMember.mockRejectedValue(
      Object.assign(new Error('Solo el dueño o un admin.'), { code: 'NOT_PERMITTED' }),
    );
    assert.deepEqual(await cerrarAvisoAsesor('n-1', 'descartar'), {
      ok: false,
      message: 'Solo el dueño o un admin.',
    });
  });
});

describe('resumenParaCompartir', () => {
  it('the month’s real sales and profit, for the business', async () => {
    readSession.mockResolvedValue({ business_id: 'biz-1' });
    loadEstadosModel.mockResolvedValue({
      resultados: { ingresos: 88_500n, utilidadOperativa: -1_582_500n },
    });
    getBusiness.mockResolvedValue({ nombre: 'Taquería Don Pedro' });
    assert.deepEqual(await resumenParaCompartir(), {
      ok: true,
      negocio: 'Taquería Don Pedro',
      mes: '2026-05',
      ventas: 88_500n,
      utilidad: -1_582_500n,
    });
    assert.deepEqual(loadEstadosModel.mock.calls[0], ['biz-1', '2026-05-01', '2026-05-31']);
  });

  it('without a session there is nothing to share', async () => {
    readSession.mockResolvedValue(null);
    assert.deepEqual(await resumenParaCompartir(), {
      ok: false,
      message: 'Inicia sesión para continuar.',
    });
  });

  it('a failure is reported behind the retry message; an unnamed business is «tu negocio»', async () => {
    readSession.mockResolvedValue({ business_id: 'biz-1' });
    loadEstadosModel.mockResolvedValue({ resultados: { ingresos: 0n, utilidadOperativa: 0n } });
    getBusiness.mockResolvedValue(null);
    const r = await resumenParaCompartir();
    assert.equal(r.ok && r.negocio, 'tu negocio');
    loadEstadosModel.mockRejectedValue(new Error('timeout'));
    assert.deepEqual(await resumenParaCompartir(), {
      ok: false,
      message: 'No pudimos armar el mensaje. Intenta de nuevo.',
    });
    assert.equal(reportError.mock.calls.length, 1);
  });
});
