/**
 * CerrarCajaUseCase tests (Phase 6: Caja).
 *
 * Happy path + 3 unhappy paths per CLAUDE.md §8.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, CajaTurnoId, UserId } from '@cachink/domain';
import { today } from '@cachink/domain';
import {
  InMemoryCajaTurnosRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  makeNewSale,
} from '../../testing/src/index.js';
import { AbrirCajaUseCase, CerrarCajaUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0C7SR1' as UserId;

describe('CerrarCajaUseCase', () => {
  let turnos: InMemoryCajaTurnosRepository;
  let sales: InMemorySalesRepository;
  let expenses: InMemoryExpensesRepository;
  let abrirCaja: AbrirCajaUseCase;
  let useCase: CerrarCajaUseCase;

  beforeEach(() => {
    turnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    abrirCaja = new AbrirCajaUseCase(turnos);
    useCase = new CerrarCajaUseCase(turnos, sales, expenses);
  });

  /** Open a turn and return its id. */
  async function openTurn(): Promise<CajaTurnoId> {
    const turno = await abrirCaja.execute({
      userId: USER,
      fecha: '2026-05-09',
      montoAperturaCentavos: 5000n,
      businessId: BIZ,
    });
    return turno.id;
  }

  it('closes an open turn with exact cash match (no discrepancy)', async () => {
    const turnoId = await openTurn();
    const closed = await useCase.execute({
      turnoId,
      montoCierreCentavos: 5000n,
      discrepancyReason: null,
      explicacion: null,
      businessId: BIZ,
    });
    expect(closed.cierreAt).not.toBeNull();
    expect(closed.montoCierreCentavos).toBe(5000n);
    expect(closed.diferenciaCentavos).toBe(0n);
    expect(closed.discrepancyReason).toBeNull();
  });

  it('closes with discrepancy + valid reason (stores diferenciaCentavos)', async () => {
    const turnoId = await openTurn();
    const closed = await useCase.execute({
      turnoId,
      montoCierreCentavos: 5500n, // $5 over expected (5000)
      discrepancyReason: 'sobrante',
      explicacion: 'Cliente dejó propina extra',
      businessId: BIZ,
    });
    expect(closed.cierreAt).not.toBeNull();
    expect(closed.montoCierreCentavos).toBe(5500n);
    expect(closed.diferenciaCentavos).toBe(500n);
    expect(closed.discrepancyReason).toBe('sobrante');
    expect(closed.explicacion).toBe('Cliente dejó propina extra');
    expect(closed.egresoAutoId).toBeNull();
  });

  it('rejects closing a non-existent turno', async () => {
    await expect(
      useCase.execute({
        turnoId: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as CajaTurnoId,
        montoCierreCentavos: 5000n,
        discrepancyReason: null,
        explicacion: null,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/no encontrado/);
  });

  it('rejects closing an already-closed turno', async () => {
    const turnoId = await openTurn();
    await useCase.execute({
      turnoId,
      montoCierreCentavos: 5000n,
      discrepancyReason: null,
      explicacion: null,
      businessId: BIZ,
    });
    await expect(
      useCase.execute({
        turnoId,
        montoCierreCentavos: 5000n,
        discrepancyReason: null,
        explicacion: null,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/ya fue cerrado/);
  });

  it('requires a discrepancy reason when cash does not match', async () => {
    const turnoId = await openTurn();
    await expect(
      useCase.execute({
        turnoId,
        montoCierreCentavos: 4000n, // $10 less than expected
        discrepancyReason: null,
        explicacion: null,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/razón/);
  });

  it('auto-creates an egreso when reason is gasto-no-registrado', async () => {
    const turnoId = await openTurn();
    const closed = await useCase.execute({
      turnoId,
      montoCierreCentavos: 4000n,
      discrepancyReason: 'gasto-no-registrado',
      explicacion: 'Compra de bolsas',
      businessId: BIZ,
    });
    expect(closed.egresoAutoId).not.toBeNull();
    // The egreso should exist in the expenses repo
    const todayStr = today();
    const all = await expenses.findByDateRange(
      todayStr,
      todayStr,
      BIZ,
    );
    expect(all.length).toBe(1);
    expect(all[0]!.concepto).toBe('Compra de bolsas');
  });

  it('accounts for sales in the expected cash computation', async () => {
    const turnoId = await openTurn();
    // Add an Efectivo sale of $30
    await sales.create(makeNewSale({
      businessId: BIZ,
      metodo: 'Efectivo',
      monto: 3000n,
      fecha: '2026-05-09',
    }));
    // Expected = apertura (5000) + efectivo ventas (3000) = 8000
    const closed = await useCase.execute({
      turnoId,
      montoCierreCentavos: 8000n,
      discrepancyReason: null,
      explicacion: null,
      businessId: BIZ,
    });
    expect(closed.diferenciaCentavos).toBe(0n);
    expect(closed.efectivoEsperadoCentavos).toBe(8000n);
  });

  it('closes a turn that already has a blind count saved', async () => {
    const turnoId = await openTurn();
    // Simulate Step 1: save blind count
    await turnos.update(turnoId, {
      conteoCentavos: 4800n,
      conteoAt: '2026-05-09T18:30:00.000Z',
    });
    // Verify blind count was saved
    const turnoWithCount = await turnos.findById(turnoId);
    expect(turnoWithCount?.conteoCentavos).toBe(4800n);
    expect(turnoWithCount?.conteoAt).toBe('2026-05-09T18:30:00.000Z');
    // Step 2: close with the pre-saved count amount
    const closed = await useCase.execute({
      turnoId,
      montoCierreCentavos: 4800n,
      discrepancyReason: 'error-en-cambio',
      explicacion: 'Probablemente di mal el cambio',
      businessId: BIZ,
    });
    expect(closed.cierreAt).not.toBeNull();
    expect(closed.montoCierreCentavos).toBe(4800n);
    expect(closed.conteoCentavos).toBe(4800n);
    expect(closed.diferenciaCentavos).toBe(-200n);
  });

  it('blind count is immutable once saved (update does not clear it)', async () => {
    const turnoId = await openTurn();
    // Save blind count
    await turnos.update(turnoId, {
      conteoCentavos: 4100n,
      conteoAt: '2026-05-09T18:30:00.000Z',
    });
    // Close should not clear conteoCentavos
    const closed = await useCase.execute({
      turnoId,
      montoCierreCentavos: 4100n,
      discrepancyReason: 'faltante-sin-explicacion',
      explicacion: null,
      businessId: BIZ,
    });
    expect(closed.conteoCentavos).toBe(4100n);
    expect(closed.conteoAt).toBe('2026-05-09T18:30:00.000Z');
  });

  it('computes esperado from apertura + adicional + ventas - egresos', async () => {
    // Open with apertura=5000, adicional=2000
    const turno = await abrirCaja.execute({
      userId: USER,
      fecha: '2026-05-09',
      montoAperturaCentavos: 5000n,
      efectivoAdicionalCentavos: 2000n,
      businessId: BIZ,
    });
    // 2 cash sales: 3000 + 1500 = 4500
    await sales.create(makeNewSale({
      businessId: BIZ,
      metodo: 'Efectivo',
      monto: 3000n,
      fecha: '2026-05-09',
    }));
    await sales.create(makeNewSale({
      businessId: BIZ,
      metodo: 'Efectivo',
      monto: 1500n,
      fecha: '2026-05-09',
    }));
    // 1 non-cash sale (should NOT affect esperado)
    await sales.create(makeNewSale({
      businessId: BIZ,
      metodo: 'Transferencia',
      monto: 9000n,
      fecha: '2026-05-09',
    }));
    // 1 expense: 1000
    await expenses.create({
      fecha: '2026-05-09',
      concepto: 'Compra de servilletas',
      categoria: 'Insumo',
      monto: 1000n,
      businessId: BIZ,
    });
    // Expected = 5000 + 2000 + 4500 - 1000 = 10500
    const closed = await useCase.execute({
      turnoId: turno.id,
      montoCierreCentavos: 10500n,
      discrepancyReason: null,
      explicacion: null,
      businessId: BIZ,
    });
    expect(closed.efectivoEsperadoCentavos).toBe(10500n);
    expect(closed.diferenciaCentavos).toBe(0n);
    expect(closed.totalTransferencias).toBe(9000n);
  });
});
