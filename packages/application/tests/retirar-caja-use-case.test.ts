/**
 * RetirarCajaUseCase tests.
 *
 * Happy path + 3 unhappy paths per CLAUDE.md §6.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, CajaTurnoId, UserId } from '@cachink/domain';
import {
  InMemoryCajaMovimientosRepository,
  InMemoryCajaTurnosRepository,
  TEST_DEVICE_ID,
} from '../../testing/src/index.js';
import { AbrirCajaUseCase } from '../src/index.js';
import { RetirarCajaUseCase } from '../src/retirar-caja/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0C7SR1' as UserId;

describe('RetirarCajaUseCase', () => {
  let movimientos: InMemoryCajaMovimientosRepository;
  let turnos: InMemoryCajaTurnosRepository;
  let abrirCaja: AbrirCajaUseCase;
  let useCase: RetirarCajaUseCase;

  beforeEach(() => {
    movimientos = new InMemoryCajaMovimientosRepository(TEST_DEVICE_ID);
    turnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
    abrirCaja = new AbrirCajaUseCase(turnos);
    useCase = new RetirarCajaUseCase(movimientos, turnos);
  });

  async function openTurn(): Promise<CajaTurnoId> {
    const turno = await abrirCaja.execute({
      userId: USER,
      fecha: '2026-05-09',
      montoAperturaCentavos: 5000n,
      businessId: BIZ,
    });
    return turno.id;
  }

  it('withdraws cash from an open turn', async () => {
    const turnoId = await openTurn();
    const mov = await useCase.execute({
      turnoId,
      tipo: 'retiro',
      montoCentavos: 1500n,
      motivo: 'Depósito bancario',
      userId: USER,
      businessId: BIZ,
    });

    expect(mov.turnoId).toBe(turnoId);
    expect(mov.tipo).toBe('retiro');
    expect(mov.montoCentavos).toBe(1500n);
    expect(mov.motivo).toBe('Depósito bancario');
  });

  it('rejects withdrawal from non-existent turno', async () => {
    const fakeTurnoId = '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as CajaTurnoId;
    await expect(
      useCase.execute({
        turnoId: fakeTurnoId,
        tipo: 'retiro',
        montoCentavos: 1000n,
        motivo: 'Bank run',
        userId: USER,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/no encontrado/);
  });

  it('rejects withdrawal from a closed turno', async () => {
    const turnoId = await openTurn();
    await turnos.update(turnoId, {
      cierreAt: '2026-05-09T18:00:00.000Z',
      montoCierreCentavos: 5000n,
      efectivoEsperadoCentavos: 5000n,
      diferenciaCentavos: 0n,
    });

    await expect(
      useCase.execute({
        turnoId,
        tipo: 'retiro',
        montoCentavos: 500n,
        motivo: 'Late withdrawal',
        userId: USER,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/turno cerrado/);
  });

  it('rejects withdrawal with empty motivo (Zod validation)', async () => {
    const turnoId = await openTurn();
    await expect(
      useCase.execute({
        turnoId,
        tipo: 'retiro',
        montoCentavos: 1000n,
        motivo: '',
        userId: USER,
        businessId: BIZ,
      }),
    ).rejects.toThrow();
  });
});
