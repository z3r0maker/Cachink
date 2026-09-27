import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * P-30's per-business generation, as composition (ADR-056).
 *
 * The order is the decision this module exists to hold: the entitlement
 * decides the cadencia, `@xangarro/domain` computes the insights, the tier
 * filters them, and only then are they written. A figure is never computed
 * twice by two paths, so what the Asesor says and what Estados financieros
 * shows are the same number — and that only stays true while the deterministic
 * layer is what feeds the store.
 *
 * `asesor-invocacion.test.ts` covers who may call it and what a failure
 * answers; this covers what it does with what it reads.
 */
const calls: string[] = [];

vi.mock('@xangarro/domain', () => ({
  calcularInsights: vi.fn((inputs: { readonly n: number }) => {
    calls.push('calcularInsights');
    return Array.from({ length: inputs.n }, (_, i) => ({ clave: `i${i}`, urgencia: i }));
  }),
  filtrarPorCadencia: vi.fn((insights: readonly unknown[], cadencia: string) => {
    calls.push(`filtrarPorCadencia:${cadencia}`);
    return cadencia === 'semanal' ? insights.slice(0, 2) : insights;
  }),
}));

vi.mock('@xangarro/data-pg', () => ({
  asesorInputs: vi.fn(async () => {
    calls.push('asesorInputs');
    return { n: 5 };
  }),
  materializarInsights: vi.fn(async (_tx: unknown, _biz: string, visibles: readonly unknown[]) => {
    calls.push('materializarInsights');
    return { materializados: visibles.length, cerrados: 1 };
  }),
}));

vi.mock('../src/server/db', () => ({
  withTenant: vi.fn(async (_biz: string, fn: (tx: unknown) => unknown) => fn({ tx: true })),
}));

vi.mock('../src/server/clock', () => ({ hoy: vi.fn(() => '2026-05-12') }));

const cadenciaDelPlan = vi.fn(() => 'diario');
vi.mock('../src/server/billing/plan', () => ({
  tenantEntitlement: vi.fn(async () => ({ capabilities: { asesor: cadenciaDelPlan() } })),
}));

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';

async function load() {
  const mod = await import('../src/server/asesor/runtime');
  return mod.generarParaNegocio;
}

describe('generarParaNegocio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls.length = 0;
    cadenciaDelPlan.mockReturnValue('diario');
  });

  it('reports the cadencia the plan grants and what it wrote', async () => {
    const generar = await load();
    const r = await generar(BIZ, { now: new Date('2026-05-12T09:00:00Z') });

    assert.deepEqual(r, {
      businessId: BIZ,
      cadencia: 'diario',
      materializados: 5,
      cerrados: 1,
    });
  });

  it('computes, then filters, then writes — in that order', async () => {
    // ADR-056's ordering, as a sequence rather than a comment: the model call
    // that joins later is prompted from these values, so anything that wrote
    // before filtering would store what the tier may not receive.
    const generar = await load();
    await generar(BIZ, { now: new Date('2026-05-12T09:00:00Z') });

    assert.deepEqual(calls, [
      'asesorInputs',
      'calcularInsights',
      'filtrarPorCadencia:diario',
      'materializarInsights',
    ]);
  });

  it('a weekly tier stores only what its cadencia receives', async () => {
    // ADR-059: «semanal» sees the two most urgent. The filter decides how many
    // rows exist, so a tier that filtered after writing would leak the rest.
    cadenciaDelPlan.mockReturnValue('semanal');
    const generar = await load();
    const r = await generar(BIZ, { now: new Date('2026-05-12T09:00:00Z') });

    assert.equal(r.cadencia, 'semanal');
    assert.equal(r.materializados, 2, 'five computed, two stored');
  });

  it('a tenant with nothing to say writes nothing, and does not fail', async () => {
    const dataPg = await import('@xangarro/data-pg');
    vi.mocked(dataPg.asesorInputs).mockResolvedValueOnce({ n: 0 } as never);
    const generar = await load();
    const r = await generar(BIZ, { now: new Date('2026-05-12T09:00:00Z') });

    assert.equal(r.materializados, 0);
  });

  it('reads the business day from the portal clock, not from `now`', async () => {
    // `now` is billing's instant — the entitlement is read as of it. The day
    // the insights are computed for is the business's, which `hoy()` pins
    // (PORTAL_TODAY), and the two are not interchangeable.
    const dataPg = await import('@xangarro/data-pg');
    const generar = await load();
    await generar(BIZ, { now: new Date('2099-01-01T00:00:00Z') });

    const [, dia] = vi.mocked(dataPg.asesorInputs).mock.calls[0] ?? [];
    assert.equal(dia, '2026-05-12');
  });
});
