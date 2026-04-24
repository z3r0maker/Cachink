import { describe, expect, it } from 'vitest';
import type {
  BalanceGeneral,
  EstadoDeResultados,
} from '../../src/financials/index.js';
import { calculateIndicadores } from '../../src/financials/index.js';

function makeER(overrides: Partial<EstadoDeResultados> = {}): EstadoDeResultados {
  return {
    ingresos: 100_000n,
    costoDeVentas: 40_000n,
    utilidadBruta: 60_000n,
    gastosOperativos: 30_000n,
    utilidadOperativa: 30_000n,
    isr: 9_000n,
    utilidadNeta: 21_000n,
    ...overrides,
  };
}

function makeBG(overrides: Partial<BalanceGeneral> = {}): BalanceGeneral {
  return {
    activo: {
      efectivo: 50_000n,
      inventarios: 20_000n,
      cuentasPorCobrar: 10_000n,
      total: 80_000n,
    },
    pasivo: { total: 20_000n },
    capital: { utilidadDelPeriodo: 21_000n, total: 21_000n },
    ...overrides,
  };
}

describe('calculateIndicadores', () => {
  it('computes margins as fractions', () => {
    const result = calculateIndicadores({
      estadoResultados: makeER(),
      balanceGeneral: makeBG(),
      inventarioPromedio: 10_000n,
      ventasCreditoPeriodoCentavos: 50_000n,
      periodoDiasVenta: 30,
    });
    expect(result.margenBruto).toBe(0.6);
    expect(result.margenOperativo).toBe(0.3);
    expect(result.margenNeto).toBe(0.21);
  });

  it('computes razón de liquidez as activo / pasivo', () => {
    const result = calculateIndicadores({
      estadoResultados: makeER(),
      balanceGeneral: makeBG(),
      inventarioPromedio: 10_000n,
      ventasCreditoPeriodoCentavos: 50_000n,
      periodoDiasVenta: 30,
    });
    expect(result.razonDeLiquidez).toBe(4);
  });

  it('computes rotación de inventario as costoDeVentas / inventarioPromedio', () => {
    const result = calculateIndicadores({
      estadoResultados: makeER({ costoDeVentas: 60_000n }),
      balanceGeneral: makeBG(),
      inventarioPromedio: 15_000n,
      ventasCreditoPeriodoCentavos: 50_000n,
      periodoDiasVenta: 30,
    });
    expect(result.rotacionInventario).toBe(4);
  });

  it('días promedio de cobranza = (CxC / ventasCrédito) × días', () => {
    const result = calculateIndicadores({
      estadoResultados: makeER(),
      balanceGeneral: makeBG({
        activo: {
          efectivo: 0n,
          inventarios: 0n,
          cuentasPorCobrar: 30_000n,
          total: 30_000n,
        },
        pasivo: { total: 1n },
        capital: { utilidadDelPeriodo: 0n, total: 0n },
      }),
      inventarioPromedio: 1n,
      ventasCreditoPeriodoCentavos: 100_000n,
      periodoDiasVenta: 30,
    });
    expect(result.diasPromedioCobranza).toBe(9);
  });

  it('zero ingresos → all margins null', () => {
    const result = calculateIndicadores({
      estadoResultados: makeER({
        ingresos: 0n,
        utilidadBruta: -1_000n,
        utilidadOperativa: -1_000n,
        utilidadNeta: -1_000n,
      }),
      balanceGeneral: makeBG(),
      inventarioPromedio: 1_000n,
      ventasCreditoPeriodoCentavos: 1_000n,
      periodoDiasVenta: 30,
    });
    expect(result.margenBruto).toBeNull();
    expect(result.margenOperativo).toBeNull();
    expect(result.margenNeto).toBeNull();
  });

  it('zero pasivo → razón de liquidez null', () => {
    const result = calculateIndicadores({
      estadoResultados: makeER(),
      balanceGeneral: makeBG({
        pasivo: { total: 0n },
      }),
      inventarioPromedio: 10_000n,
      ventasCreditoPeriodoCentavos: 50_000n,
      periodoDiasVenta: 30,
    });
    expect(result.razonDeLiquidez).toBeNull();
  });

  it('zero inventarioPromedio → rotación null', () => {
    const result = calculateIndicadores({
      estadoResultados: makeER(),
      balanceGeneral: makeBG(),
      inventarioPromedio: 0n,
      ventasCreditoPeriodoCentavos: 50_000n,
      periodoDiasVenta: 30,
    });
    expect(result.rotacionInventario).toBeNull();
  });

  it('no credit sales → días promedio de cobranza is null', () => {
    const result = calculateIndicadores({
      estadoResultados: makeER(),
      balanceGeneral: makeBG(),
      inventarioPromedio: 10_000n,
      ventasCreditoPeriodoCentavos: 0n,
      periodoDiasVenta: 30,
    });
    expect(result.diasPromedioCobranza).toBeNull();
  });

  it('credit sales but zero CxC → días = 0 (everything collected)', () => {
    const result = calculateIndicadores({
      estadoResultados: makeER(),
      balanceGeneral: makeBG({
        activo: {
          efectivo: 0n,
          inventarios: 0n,
          cuentasPorCobrar: 0n,
          total: 0n,
        },
      }),
      inventarioPromedio: 10_000n,
      ventasCreditoPeriodoCentavos: 50_000n,
      periodoDiasVenta: 30,
    });
    expect(result.diasPromedioCobranza).toBe(0);
  });

  it('all-credit period: CxC equals ventasCrédito → días = periodoLength', () => {
    const result = calculateIndicadores({
      estadoResultados: makeER(),
      balanceGeneral: makeBG({
        activo: {
          efectivo: 0n,
          inventarios: 0n,
          cuentasPorCobrar: 50_000n,
          total: 50_000n,
        },
      }),
      inventarioPromedio: 10_000n,
      ventasCreditoPeriodoCentavos: 50_000n,
      periodoDiasVenta: 30,
    });
    expect(result.diasPromedioCobranza).toBe(30);
  });
});
