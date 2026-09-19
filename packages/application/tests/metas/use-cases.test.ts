import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import type { Meta } from '@xangarro/domain';

import { CerrarMetasVencidasUseCase } from '../../src/metas/cerrar-metas-use-case.js';
import type { MetaError } from '../../src/metas/errors.js';
import { FijarMetaUseCase, nivelesPosibles } from '../../src/metas/fijar-meta-use-case.js';
import type { MetasStore, TotalesDelMes } from '../../src/metas/ports.js';

function storeCon(activa: Meta | null = null): MetasStore & {
  insertadas: Meta[];
  cierres: { id: string }[];
} {
  const insertadas: Meta[] = [];
  const cierres: { id: string }[] = [];
  return {
    insertadas,
    cierres,
    activa: async () => activa,
    cerradas: async () => [],
    insertar: async (m) => {
      insertadas.push(m);
    },
    cerrar: async (id) => {
      cierres.push({ id });
    },
  };
}

const totales: TotalesDelMes = async (_b, ym) =>
  ym === '2026-04' ? { ventas: 200_000n, gastos: 80_000n } : { ventas: 0n, gastos: 0n };

const input = {
  businessId: '01J-BIZ' as never,
  objetivo: 'vender' as const,
  motivo: 'comprar' as const,
  nivel: 'reto' as const,
  hoy: '2026-05-12',
};

describe('FijarMetaUseCase', () => {
  it('anchors the target to the last complete month (1 happy)', async () => {
    const store = storeCon();
    const meta = await new FijarMetaUseCase(store, totales).execute(input);
    assert.equal(meta.objetivoCentavos, 240_000n, '200,000 × 1.2');
    assert.equal(meta.periodo, '2026-05');
    assert.equal(store.insertadas.length, 1);
  });

  it('refuses without a base month (negocio nuevo)', async () => {
    const sinHistoria: TotalesDelMes = async () => ({ ventas: 0n, gastos: 0n });
    await assert.rejects(
      new FijarMetaUseCase(storeCon(), sinHistoria).execute(input),
      (e: MetaError) => e.code === 'NEGOCIO_NUEVO',
    );
  });

  it('refuses when a goal is already running', async () => {
    const activa = {
      ...input,
      id: 'm1',
      objetivoCentavos: 1n,
      periodo: '2026-05',
      lograda: null,
      resultadoCentavos: null,
      cerradaAt: null,
    } as unknown as Meta;
    await assert.rejects(
      new FijarMetaUseCase(storeCon(activa), totales).execute(input),
      (e: MetaError) => e.code === 'META_ACTIVA',
    );
  });

  it('refuses an invalid date', async () => {
    await assert.rejects(
      new FijarMetaUseCase(storeCon(), totales).execute({ ...input, hoy: 'mayo' }),
      (e: MetaError) => e.code === 'META_INVALIDA',
    );
  });
});

describe('nivelesPosibles', () => {
  it('offers the three levels with their monthly and daily figures', () => {
    const niveles = nivelesPosibles(100_000n, 'vender');
    assert.deepEqual(
      niveles.map((n) => n.mensual),
      [110_000n, 120_000n, 130_000n],
    );
    assert.ok(niveles.every((n) => n.diario > 0n));
  });
});

describe('CerrarMetasVencidasUseCase', () => {
  const activa = {
    id: 'm1',
    objetivo: 'vender',
    motivo: 'comprar',
    nivel: 'reto',
    objetivoCentavos: 240_000n,
    periodo: '2026-04',
    lograda: null,
    resultadoCentavos: null,
    cerradaAt: null,
  } as unknown as Meta;

  it('closes an ended goal with its month verdict (1 happy)', async () => {
    const store = storeCon(activa);
    const cerradas = await new CerrarMetasVencidasUseCase(store, totales).execute(
      input.businessId,
      '2026-05-02',
    );
    assert.equal(cerradas.length, 1);
    assert.equal(cerradas[0]?.lograda, false, '200,000 in April vs a 240,000 target');
    assert.equal(store.cierres.length, 1);
  });

  it('leaves a current-month goal open', async () => {
    const store = storeCon({ ...activa, periodo: '2026-05' });
    const cerradas = await new CerrarMetasVencidasUseCase(store, totales).execute(
      input.businessId,
      '2026-05-12',
    );
    assert.deepEqual(cerradas, []);
    assert.equal(store.cierres.length, 0);
  });

  it('does nothing without an active goal', async () => {
    const store = storeCon(null);
    assert.deepEqual(
      await new CerrarMetasVencidasUseCase(store, totales).execute(input.businessId, '2026-05-12'),
      [],
    );
  });

  it('a gastar goal closes lograda when the month spent at most the target', async () => {
    const gastar = { ...activa, objetivo: 'gastar', objetivoCentavos: 70_000n } as unknown as Meta;
    const cerradas = await new CerrarMetasVencidasUseCase(storeCon(gastar), totales).execute(
      input.businessId,
      '2026-05-02',
    );
    assert.equal(cerradas[0]?.lograda, false, '80,000 spent vs a 70,000 ceiling');
  });
});
