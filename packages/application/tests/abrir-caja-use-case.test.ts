import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, UserId } from '@cachink/domain';
import {
  InMemoryCajaTurnosRepository,
  TEST_DEVICE_ID,
} from '../../testing/src/index.js';
import { AbrirCajaUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0C7SR1' as UserId;

describe('AbrirCajaUseCase', () => {
  let turnos: InMemoryCajaTurnosRepository;
  let useCase: AbrirCajaUseCase;

  beforeEach(() => {
    turnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
    useCase = new AbrirCajaUseCase(turnos);
  });

  it('opens a fresh turn', async () => {
    const turno = await useCase.execute({
      userId: USER,
      fecha: '2026-05-09',
      montoAperturaCentavos: 5000n,
      businessId: BIZ,
    });
    expect(turno.userId).toBe(USER);
    expect(turno.montoAperturaCentavos).toBe(5000n);
    expect(turno.cierreAt).toBeNull();
  });

  it('prevents duplicate open turns for the same user', async () => {
    await useCase.execute({
      userId: USER, fecha: '2026-05-09',
      montoAperturaCentavos: 5000n, businessId: BIZ,
    });
    await expect(
      useCase.execute({
        userId: USER, fecha: '2026-05-09',
        montoAperturaCentavos: 3000n, businessId: BIZ,
      }),
    ).rejects.toThrow(/turno abierto/);
  });

  it('accepts additional cash', async () => {
    const turno = await useCase.execute({
      userId: USER, fecha: '2026-05-09',
      montoAperturaCentavos: 5000n,
      efectivoAdicionalCentavos: 2000n,
      businessId: BIZ,
    });
    expect(turno.efectivoAdicionalCentavos).toBe(2000n);
  });

  it('initializes conteoCentavos and conteoAt as null (blind close fields)', async () => {
    const turno = await useCase.execute({
      userId: USER,
      fecha: '2026-05-09',
      montoAperturaCentavos: 5000n,
      businessId: BIZ,
    });
    expect(turno.conteoCentavos).toBeNull();
    expect(turno.conteoAt).toBeNull();
  });
});
