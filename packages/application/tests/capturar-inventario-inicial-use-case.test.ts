import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import { CapturarInventarioInicialUseCase, type AperturaMovementsPort } from '../src/index.js';

function port(seedApertura = false): AperturaMovementsPort & { rows: unknown[] } {
  const rows: unknown[] = [];
  let already = seedApertura;
  return {
    rows,
    existsApertura: async () => already,
    create: async (input) => {
      already = true;
      rows.push(input);
    },
  };
}

const BASE = {
  businessId: 'B1',
  fecha: '2026-09-01',
  rows: [
    { productoId: 'P1', cantidad: 10, costoUnitCentavos: 8_50n },
    { productoId: 'P2', cantidad: 3, costoUnitCentavos: 120_00n },
  ],
};

describe('CapturarInventarioInicialUseCase', () => {
  let p: ReturnType<typeof port>;

  beforeEach(() => {
    p = port();
  });

  it('writes one entrada per row, no egreso, and returns the valuation', async () => {
    const r = await new CapturarInventarioInicialUseCase(p).execute(BASE);
    assert.equal(p.rows.length, 2);
    assert.deepEqual(p.rows[0], {
      productoId: 'P1',
      cantidad: 10,
      costoUnitCentavos: 8_50n,
      fecha: '2026-09-01',
    });
    assert.equal(r.total, 10n * 8_50n + 3n * 120_00n);
    assert.equal(r.movimientos, 2);
  });

  it('refuses a second capture instead of merging', async () => {
    await new CapturarInventarioInicialUseCase(p).execute(BASE);
    await assert.rejects(
      new CapturarInventarioInicialUseCase(p).execute({ ...BASE, rows: BASE.rows.slice(0, 1) }),
      (e: unknown) => (e as { code?: string }).code === 'INVENTARIO_INICIAL_YA_CAPTURADO',
    );
    assert.equal(p.rows.length, 2, 'nothing more was written');
  });

  it('refuses zero, fractional or negative quantities', async () => {
    await assert.rejects(
      new CapturarInventarioInicialUseCase(p).execute({
        ...BASE,
        rows: [
          { productoId: 'P1', cantidad: 0, costoUnitCentavos: 1n },
          { productoId: 'P2', cantidad: 2.5, costoUnitCentavos: 1n },
        ],
      }),
      (e: unknown) => (e as { code?: string }).code === 'INVENTARIO_INICIAL_INVALIDO',
    );
    assert.equal(p.rows.length, 0);
  });

  it('refuses a malformed capture date', async () => {
    await assert.rejects(
      new CapturarInventarioInicialUseCase(p).execute({ ...BASE, fecha: '09/01/2026' }),
      (e: unknown) => (e as { code?: string }).code === 'INVENTARIO_INICIAL_INVALIDO',
    );
  });
});
