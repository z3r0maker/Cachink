import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

import type { Meta } from '@xangarro/domain';

/**
 * The Metas tab's read model (P-27/P-33) as `loadMetasPage` resolves it: goals
 * close lazily on load, the wizard's levels anchor to the last complete month,
 * and the celebration renders once per closed goal. These are the states the
 * E2E half reaches only through the seeded tenant's single history — here each
 * one starts from the store that produces it.
 *
 * The domain and the use cases run real; only the pg store and the clock are
 * fakes, so a state asserted here is the state every surface would read.
 */

const HOY = '2026-05-12';

let activa: Meta | null;
let cerradas: Meta[];
let celebradas: string[];
let negocio: { nombre: string } | null;
let totales: Record<string, { ventas: bigint; gastos: bigint }>;
const insertada = vi.fn();
const cerrada = vi.fn();

vi.mock('@xangarro/data-pg', () => ({
  metaActiva: async () => activa,
  metasCerradas: async () => cerradas,
  insertarMeta: vi.fn(async (_tx: unknown, _biz: string, m: Meta) => {
    insertada(m);
  }),
  cerrarMeta: async (_tx: unknown, id: string, c: { lograda: boolean }) => {
    cerrada(id, c);
    activa = null;
  },
  totalsForRange: async (_tx: unknown, desde: string) =>
    totales[desde.slice(0, 7)] ?? { ventas: 0n, gastos: 0n },
  clavesCelebradas: async () => celebradas,
  getBusiness: async () => negocio,
}));
vi.mock('../src/server/db', () => ({
  withTenant: (_biz: string, fn: (tx: unknown) => unknown) => fn({}),
}));
vi.mock('../src/server/clock', () => ({ hoy: () => HOY }));

const { fijarMeta, loadMetasPage } = await import('../src/server/metas');

function meta(over: Partial<Meta> = {}): Meta {
  return {
    id: 'm-1',
    objetivo: 'vender',
    motivo: 'colchon',
    nivel: 'reto',
    objetivoCentavos: 120_00n,
    periodo: '2026-05',
    lograda: null,
    resultadoCentavos: null,
    cerradaAt: null,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  activa = null;
  cerradas = [];
  celebradas = [];
  negocio = { nombre: 'Taquería Don Pedro' };
  totales = {};
});

describe('loadMetasPage', () => {
  it('a business with no history at all is negocio-nuevo, and the wizard anchors to zero', async () => {
    const page = await loadMetasPage('biz-1');
    assert.equal(page.estado, 'negocio-nuevo');
    assert.equal(page.meta, null);
    assert.equal(page.ritmo, null);
    assert.equal(page.actual, null);
    assert.equal(page.recienCerrada, null);
    assert.equal(page.celebrar, null);
    assert.equal(page.racha, 0);
    assert.deepEqual(
      page.niveles.map((n) => n.mensual),
      [0n, 0n, 0n],
    );
  });

  it('a business that sold last month but chose no goal is sin-meta, with real levels', async () => {
    totales['2026-04'] = { ventas: 100_000n, gastos: 40_000n };
    const page = await loadMetasPage('biz-1');
    assert.equal(page.estado, 'sin-meta');
    assert.deepEqual(
      page.niveles.map((n) => [n.id, n.pct, n.mensual]),
      [
        ['empujon', 10, 110_000n],
        ['reto', 20, 120_000n],
        ['ambicioso', 30, 130_000n],
      ],
    );
  });

  it('a business that only spent last month is sin-meta too — gastos alone breaks the tie', async () => {
    totales['2026-04'] = { ventas: 0n, gastos: 500n };
    const page = await loadMetasPage('biz-1');
    assert.equal(page.estado, 'sin-meta');
  });

  it('an active goal for the running month stays open, with its pace against today', async () => {
    activa = meta({ objetivoCentavos: 60_00n, periodo: '2026-05' });
    totales['2026-05'] = { ventas: 33_00n, gastos: 0n };
    const page = await loadMetasPage('biz-1');
    assert.equal(page.estado, 'activa');
    assert.equal(page.actual, 33_00n);
    // The domain's own arithmetic, recomputed: the read model adds no rule.
    const { ritmoDeMeta } = await import('@xangarro/domain');
    assert.deepEqual(page.ritmo, ritmoDeMeta(activa, 33_00n, HOY));
    assert.equal(cerrada.mock.calls.length, 0);
  });

  it("a goal whose month ended closes on load with the month's verdict, and earns its celebration", async () => {
    activa = meta({ periodo: '2026-04', objetivoCentavos: 100_00n });
    totales['2026-04'] = { ventas: 120_00n, gastos: 0n };
    const page = await loadMetasPage('biz-1');
    assert.equal(page.estado, 'cerrada');
    const [id, veredicto] = (cerrada.mock.calls[0] ?? []) as [
      string,
      { lograda: boolean; resultado: bigint; at: string },
    ];
    assert.equal(id, 'm-1');
    assert.deepEqual(
      { lograda: veredicto.lograda, resultado: veredicto.resultado },
      { lograda: true, resultado: 120_00n },
    );
    assert.ok(!Number.isNaN(Date.parse(veredicto.at)));
    assert.equal(page.recienCerrada?.lograda, true);
    assert.deepEqual(page.celebrar, {
      clave: 'meta:m-1',
      racha: 0,
      mes: '2026-04',
      vendido: 120_00n,
      negocio: 'Taquería Don Pedro',
    });
  });

  it('an achieved goal whose marker exists does not celebrate twice', async () => {
    activa = meta({ periodo: '2026-04', objetivoCentavos: 100_00n });
    totales['2026-04'] = { ventas: 120_00n, gastos: 0n };
    celebradas = ['meta:m-1'];
    const page = await loadMetasPage('biz-1');
    assert.equal(page.estado, 'cerrada');
    assert.equal(page.celebrar, null);
  });

  it('a goal the month did not reach closes unmet, and there is nothing to celebrate', async () => {
    activa = meta({ periodo: '2026-04', objetivoCentavos: 100_00n });
    totales['2026-04'] = { ventas: 50_00n, gastos: 0n };
    const page = await loadMetasPage('biz-1');
    const [id, veredicto] = (cerrada.mock.calls[0] ?? []) as [
      string,
      { lograda: boolean; resultado: bigint },
    ];
    assert.equal(id, 'm-1');
    assert.deepEqual(
      { lograda: veredicto.lograda, resultado: veredicto.resultado },
      { lograda: false, resultado: 50_00n },
    );
    assert.equal(page.celebrar, null);
  });

  it('a business the query cannot name falls back to «tu negocio» in the celebration', async () => {
    activa = meta({ periodo: '2026-04', objetivoCentavos: 100_00n });
    totales['2026-04'] = { ventas: 120_00n, gastos: 0n };
    negocio = null;
    const page = await loadMetasPage('biz-1');
    assert.equal(page.celebrar?.negocio, 'tu negocio');
  });
});

describe('fijarMeta', () => {
  const respuestas = { objetivo: 'vender', motivo: 'colchon', nivel: 'empujon' } as const;

  it('sets this month’s goal at the level’s percentage over the last complete month', async () => {
    totales['2026-04'] = { ventas: 100_00n, gastos: 0n };
    assert.deepEqual(await fijarMeta('biz-1', respuestas), { ok: true });
    const guardada = insertada.mock.calls[0]?.[0] as Meta;
    assert.equal(guardada.objetivoCentavos, 110_00n);
    assert.equal(guardada.periodo, '2026-05');
  });

  it('refuses when a goal is already running', async () => {
    activa = meta();
    assert.deepEqual(await fijarMeta('biz-1', respuestas), {
      ok: false,
      code: 'META_ACTIVA',
      message: 'Ya tienes una meta en curso este mes.',
    });
    assert.equal(insertada.mock.calls.length, 0);
  });

  it('refuses when there is no complete month to anchor to', async () => {
    assert.deepEqual(await fijarMeta('biz-1', respuestas), {
      ok: false,
      code: 'NEGOCIO_NUEVO',
      message:
        'Aún no hay un mes completo que comparar: registrá tus ventas y gastos y la meta del mes que entra se ancla a ellos.',
    });
  });

  it('refuses an objetivo the wizard never offered', async () => {
    totales['2026-04'] = { ventas: 100_00n, gastos: 0n };
    assert.deepEqual(await fijarMeta('biz-1', { ...respuestas, objetivo: 'volar' as never }), {
      ok: false,
      code: 'META_INVALIDA',
      message: 'Elige qué quieres lograr.',
    });
  });

  it('lets an error it does not own fly, rather than inventing a verdict', async () => {
    totales['2026-04'] = { ventas: 100_00n, gastos: 0n };
    const { insertarMeta } = vi.mocked(await import('@xangarro/data-pg'));
    insertarMeta.mockRejectedValueOnce(new Error('connection refused'));
    await assert.rejects(fijarMeta('biz-1', respuestas), /connection refused/);
  });
});
