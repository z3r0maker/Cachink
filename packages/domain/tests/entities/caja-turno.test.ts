import { describe, expect, it } from 'vitest';
import { CajaTurnoSchema, DiscrepancyReasonEnum, NewCajaTurnoSchema, CerrarCajaSchema } from '../../src/entities/caja-turno.js';

const ULID = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';

describe('DiscrepancyReasonEnum', () => {
  it('accepts all valid reasons', () => {
    const reasons = ['gasto-no-registrado', 'error-en-cambio', 'retiro-autorizado', 'faltante-sin-explicacion', 'sobrante', 'otro'];
    for (const reason of reasons) {
      expect(DiscrepancyReasonEnum.safeParse(reason).success).toBe(true);
    }
  });
  it('rejects invalid reason', () => {
    expect(DiscrepancyReasonEnum.safeParse('robo').success).toBe(false);
  });
});

describe('NewCajaTurnoSchema', () => {
  it('validates valid input', () => {
    const result = NewCajaTurnoSchema.safeParse({
      userId: ULID, fecha: '2026-05-09',
      montoAperturaCentavos: 5000n, businessId: ULID,
    });
    expect(result.success).toBe(true);
  });

  it('defaults efectivoAdicionalCentavos to 0', () => {
    const result = NewCajaTurnoSchema.parse({
      userId: ULID, fecha: '2026-05-09',
      montoAperturaCentavos: 5000n, businessId: ULID,
    });
    expect(result.efectivoAdicionalCentavos).toBe(0n);
  });
});

describe('CerrarCajaSchema', () => {
  it('validates with reason and explanation', () => {
    const result = CerrarCajaSchema.safeParse({
      turnoId: ULID, montoCierreCentavos: 4500n,
      discrepancyReason: 'error-en-cambio', explicacion: 'Cambio incorrecto',
    });
    expect(result.success).toBe(true);
  });

  it('validates with null reason (no discrepancy)', () => {
    const result = CerrarCajaSchema.safeParse({
      turnoId: ULID, montoCierreCentavos: 5000n,
      discrepancyReason: null, explicacion: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('CajaTurnoSchema — blind close fields', () => {
  const BASE_TURNO = {
    id: ULID,
    userId: ULID,
    fecha: '2026-05-09',
    aperturaAt: '2026-05-09T08:00:00.000Z',
    cierreAt: null,
    montoAperturaCentavos: 5000n,
    efectivoAdicionalCentavos: 0n,
    montoCierreCentavos: null,
    efectivoEsperadoCentavos: null,
    diferenciaCentavos: null,
    discrepancyReason: null,
    explicacion: null,
    totalTransferencias: 0n,
    totalTarjeta: 0n,
    totalQr: 0n,
    totalCredito: 0n,
    egresoAutoId: null,
    businessId: ULID,
    deviceId: ULID,
    createdByUserId: null,
    createdAt: '2026-05-09T08:00:00.000Z',
    updatedAt: '2026-05-09T08:00:00.000Z',
    deletedAt: null,
  };

  it('defaults conteoCentavos to null', () => {
    const result = CajaTurnoSchema.parse(BASE_TURNO);
    expect(result.conteoCentavos).toBeNull();
  });

  it('defaults conteoAt to null', () => {
    const result = CajaTurnoSchema.parse(BASE_TURNO);
    expect(result.conteoAt).toBeNull();
  });

  it('accepts conteoCentavos as a bigint value', () => {
    const result = CajaTurnoSchema.parse({
      ...BASE_TURNO,
      conteoCentavos: 4100n,
      conteoAt: '2026-05-09T18:30:00.000Z',
    });
    expect(result.conteoCentavos).toBe(4100n);
    expect(result.conteoAt).toBe('2026-05-09T18:30:00.000Z');
  });

  it('rejects conteoCentavos with a non-numeric value', () => {
    const result = CajaTurnoSchema.safeParse({
      ...BASE_TURNO,
      conteoCentavos: 'abc',
    });
    expect(result.success).toBe(false);
  });
});
