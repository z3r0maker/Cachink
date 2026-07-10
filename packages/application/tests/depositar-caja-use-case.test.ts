/**
 * DepositarCajaUseCase tests.
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
import { DepositarCajaUseCase } from '../src/depositar-caja/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0C7SR1' as UserId;

describe('DepositarCajaUseCase', () => {
  let movimientos: InMemoryCajaMovimientosRepository;
  let turnos: InMemoryCajaTurnosRepository;
  let abrirCaja: AbrirCajaUseCase;
  let useCase: DepositarCajaUseCase;

  beforeEach(() => {
    movimientos = new InMemoryCajaMovimientosRepository(TEST_DEVICE_ID);
    turnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
    abrirCaja = new AbrirCajaUseCase(turnos);
    useCase = new DepositarCajaUseCase(movimientos, turnos);
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

  it('deposits cash into an open turn', async () => {
    const turnoId = await openTurn();
    const mov = await useCase.execute({
      turnoId,
      tipo: 'deposito',
      montoCentavos: 2000n,
      motivo: 'Cambio para el día',
      userId: USER,
      businessId: BIZ,
    });

    expect(mov.turnoId).toBe(turnoId);
    expect(mov.tipo).toBe('deposito');
    expect(mov.montoCentavos).toBe(2000n);
    expect(mov.motivo).toBe('Cambio para el día');
  });

  it('rejects deposit on non-existent turno', async () => {
    const fakeTurnoId = '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as CajaTurnoId;
    await expect(
      useCase.execute({
        turnoId: fakeTurnoId,
        tipo: 'deposito',
        montoCentavos: 1000n,
        motivo: 'Extra cash',
        userId: USER,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/no encontrado/);
  });

  it('rejects deposit on a closed turno', async () => {
    const turnoId = await openTurn();
    // Close the turn directly via repository
    await turnos.update(turnoId, {
      cierreAt: '2026-05-09T18:00:00.000Z',
      montoCierreCentavos: 5000n,
      efectivoEsperadoCentavos: 5000n,
      diferenciaCentavos: 0n,
    });

    await expect(
      useCase.execute({
        turnoId,
        tipo: 'deposito',
        montoCentavos: 500n,
        motivo: 'Late deposit',
        userId: USER,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/turno cerrado/);
  });

  it('rejects deposit with empty motivo (Zod validation)', async () => {
    const turnoId = await openTurn();
    await expect(
      useCase.execute({
        turnoId,
        tipo: 'deposito',
        montoCentavos: 1000n,
        motivo: '',
        userId: USER,
        businessId: BIZ,
      }),
    ).rejects.toThrow();
  });
});
