import { describe, expect, it } from 'vitest';
import { DiscrepancyReasonEnum, NewCajaTurnoSchema, CerrarCajaSchema } from '../../src/entities/caja-turno.js';

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
