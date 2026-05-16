import { describe, it, expect } from 'vitest';
import { computeCajaBalance, type CajaBalanceInput } from '../../src/financials/caja-balance.js';

function input(overrides: Partial<CajaBalanceInput> = {}): CajaBalanceInput {
  return {
    aperturaCentavos: 100000n, // $1,000
    adicionalCentavos: 0n,
    ventasEfectivoCentavos: [],
    efectivoRecibidoPorVenta: [],
    egresosEfectivoCentavos: [],
    depositosCentavos: [],
    retirosCentavos: [],
    cancelacionesEfectivoCentavos: [],
    ...overrides,
  };
}

describe('computeCajaBalance', () => {
  it('returns apertura when no other movements exist', () => {
    const result = computeCajaBalance(input());
    expect(result.efectivoEnCaja).toBe(100000n);
    expect(result.desglose.apertura).toBe(100000n);
  });

  it('adds adicional to balance', () => {
    const result = computeCajaBalance(input({ adicionalCentavos: 50000n }));
    expect(result.efectivoEnCaja).toBe(150000n);
  });

  it('adds cash sale amounts to balance', () => {
    const result = computeCajaBalance(
      input({ ventasEfectivoCentavos: [6500n, 15000n] }),
    );
    // 100000 + 6500 + 15000 = 121500
    expect(result.efectivoEnCaja).toBe(121500n);
    expect(result.desglose.ventasEfectivo).toBe(21500n);
  });

  it('subtracts change given to customers', () => {
    const result = computeCajaBalance(
      input({
        ventasEfectivoCentavos: [6500n],
        efectivoRecibidoPorVenta: [
          { monto: 6500n, efectivoRecibido: 10000n }, // $35 change
        ],
      }),
    );
    // 100000 + 6500 - 3500 = 103000
    expect(result.efectivoEnCaja).toBe(103000n);
    expect(result.desglose.cambiosDados).toBe(3500n);
  });

  it('does not subtract change when customer pays exact', () => {
    const result = computeCajaBalance(
      input({
        ventasEfectivoCentavos: [6500n],
        efectivoRecibidoPorVenta: [
          { monto: 6500n, efectivoRecibido: 6500n }, // exact
        ],
      }),
    );
    expect(result.desglose.cambiosDados).toBe(0n);
    expect(result.efectivoEnCaja).toBe(106500n);
  });

  it('subtracts cash expenses', () => {
    const result = computeCajaBalance(
      input({ egresosEfectivoCentavos: [25000n] }),
    );
    // 100000 - 25000 = 75000
    expect(result.efectivoEnCaja).toBe(75000n);
    expect(result.desglose.egresosEfectivo).toBe(25000n);
  });

  it('adds manual deposits', () => {
    const result = computeCajaBalance(
      input({ depositosCentavos: [50000n, 20000n] }),
    );
    expect(result.efectivoEnCaja).toBe(170000n);
    expect(result.desglose.depositos).toBe(70000n);
  });

  it('subtracts manual withdrawals', () => {
    const result = computeCajaBalance(
      input({ retirosCentavos: [200000n] }),
    );
    // 100000 - 200000 = -100000 (can go negative)
    expect(result.efectivoEnCaja).toBe(-100000n);
    expect(result.desglose.retiros).toBe(200000n);
  });

  it('subtracts cancelled cash sales (cash returned)', () => {
    const result = computeCajaBalance(
      input({ cancelacionesEfectivoCentavos: [6500n] }),
    );
    expect(result.efectivoEnCaja).toBe(93500n);
    expect(result.desglose.cancelacionesEfectivo).toBe(6500n);
  });

  it('computes a realistic full-day scenario correctly', () => {
    const result = computeCajaBalance(
      input({
        aperturaCentavos: 100000n,
        adicionalCentavos: 0n,
        ventasEfectivoCentavos: [6500n, 15000n, 3500n],
        efectivoRecibidoPorVenta: [
          { monto: 6500n, efectivoRecibido: 10000n }, // $35 change
          { monto: 15000n, efectivoRecibido: 20000n }, // $50 change
          { monto: 3500n, efectivoRecibido: 3500n }, // exact
        ],
        egresosEfectivoCentavos: [5000n],
        depositosCentavos: [50000n],
        retirosCentavos: [200000n],
        cancelacionesEfectivoCentavos: [6500n],
      }),
    );
    // 100000 + 0 + 25000 - 8500 - 5000 + 50000 - 200000 - 6500 = -45000
    expect(result.efectivoEnCaja).toBe(-45000n);
  });

  it('handles empty arrays gracefully', () => {
    const result = computeCajaBalance(input());
    expect(result.desglose.ventasEfectivo).toBe(0n);
    expect(result.desglose.cambiosDados).toBe(0n);
    expect(result.desglose.egresosEfectivo).toBe(0n);
    expect(result.desglose.depositos).toBe(0n);
    expect(result.desglose.retiros).toBe(0n);
    expect(result.desglose.cancelacionesEfectivo).toBe(0n);
  });

  // --- Blind close scenarios ---

  it('blind close: efectivoEnCaja matches expected for discrepancy = 0', () => {
    // Operator counts exactly what's expected
    const result = computeCajaBalance(
      input({
        aperturaCentavos: 100000n,
        ventasEfectivoCentavos: [23000n],
        egresosEfectivoCentavos: [5000n],
      }),
    );
    // Expected: 100000 + 23000 - 5000 = 118000
    expect(result.efectivoEnCaja).toBe(118000n);
    // If operator blind-counts 118000, diff = 0
    const operatorCount = 118000n;
    expect(operatorCount - result.efectivoEnCaja).toBe(0n);
  });

  it('blind close: detects negative discrepancy (missing cash)', () => {
    const result = computeCajaBalance(
      input({
        aperturaCentavos: 500000n,
        ventasEfectivoCentavos: [23000n],
      }),
    );
    // Expected: 500000 + 23000 = 523000
    expect(result.efectivoEnCaja).toBe(523000n);
    // Operator counts only 415000 → -108000 difference
    const operatorCount = 415000n;
    const diff = operatorCount - result.efectivoEnCaja;
    expect(diff).toBe(-108000n);
    expect(diff < 0n).toBe(true);
  });

  it('blind close: detects positive discrepancy (extra cash)', () => {
    const result = computeCajaBalance(input({ aperturaCentavos: 100000n }));
    // Expected: 100000
    const operatorCount = 105000n;
    const diff = operatorCount - result.efectivoEnCaja;
    expect(diff).toBe(5000n);
    expect(diff > 0n).toBe(true);
  });
});
