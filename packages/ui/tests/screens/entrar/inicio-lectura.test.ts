/**
 * leerFilasInicio (M-06, M-18): which turno Inicio reads. One open turno per
 * caja (ADR-071 §3): the caja's open turno is everyone's, whoever opened it,
 * and Cobrar reads the same one, so the hero and the gate never disagree (the
 * stuck-operator case M-06 fixed). Continuing it or closing it is the choice
 * right after the NIP.
 */
import { describe, expect, it } from 'vitest';
import type { BusinessId, CajaTurno, UserId } from '@xangarro/domain';
import { leerFilasInicio } from '../../../src/screens/Inicio/inicio-lectura';

const HOY = '2026-05-14';
const TONI = 'U1' as UserId;
const ANA = 'U2' as UserId;
const BUSINESS = 'B' as BusinessId;

function turno(p: Partial<CajaTurno>): CajaTurno {
  return {
    id: 'T1',
    userId: TONI,
    fecha: HOY,
    aperturaAt: new Date(2026, 4, 14, 8, 15).toISOString(),
    cierreAt: null,
    montoAperturaCentavos: 80_000n,
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
    conteoCentavos: null,
    conteoAt: null,
    denominaciones: null,
    businessId: BUSINESS,
    deviceId: 'D',
    createdByUserId: null,
    createdAt: new Date(2026, 4, 14, 8, 15).toISOString(),
    updatedAt: '',
    deletedAt: null,
    ...p,
  } as CajaTurno;
}

function repos(turnos: readonly CajaTurno[]) {
  return {
    cajaTurnos: {
      findOpenByBusiness: async () =>
        [...turnos]
          .filter((t) => t.cierreAt === null)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null,
      findLatest: async () =>
        [...turnos].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null,
      findByDateRange: async () => turnos,
    },
    tickets: { findByDateRange: async () => [] },
    sales: { findByDateRange: async () => [] },
    expenses: { findByDateRange: async () => [] },
    clientPayments: { findByCajaTurno: async () => [] },
    recurringExpenses: { findDue: async () => [] },
    products: { listForBusiness: async () => [] },
    inventoryMovements: { sumStock: async () => 0n },
  } as unknown as Parameters<typeof leerFilasInicio>[0];
}

describe('leerFilasInicio — whose turno', () => {
  it("reads the caja's open turno", async () => {
    const filas = await leerFilasInicio(repos([turno({ id: 'mio' })]), BUSINESS, HOY);
    expect(filas.turno?.id).toBe('mio');
  });

  it('a colleague’s open turno is the caja’s: Inicio reads it (M-18)', async () => {
    const filas = await leerFilasInicio(
      repos([turno({ id: 'ajena-abierta', userId: ANA, createdAt: '2026-05-14T09:00:00.000Z' })]),
      BUSINESS,
      HOY,
    );
    expect(filas.turno?.id).toBe('ajena-abierta');
  });

  it('a closed turno still backs the day’s figures after the cierre', async () => {
    const filas = await leerFilasInicio(
      repos([turno({ id: 'cerrado', cierreAt: '2026-05-14T21:00:00.000Z' })]),
      BUSINESS,
      HOY,
    );
    expect(filas.turno?.id).toBe('cerrado');
  });

  it('a first day on the device reads with no turno at all', async () => {
    const filas = await leerFilasInicio(repos([]), BUSINESS, HOY);
    expect(filas.turno).toBeNull();
  });
});
