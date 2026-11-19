import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, UserId } from '@xangarro/domain';
import { InMemoryCajaTurnosRepository, TEST_DEVICE_ID } from '../../testing/src/index.js';
import { AbrirCajaUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0C7SR1' as UserId;
const OTRO = '01HZ8XQN9GZJXV8AKQ5X0C7SR2' as UserId;
const OTRO_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7XBZ' as BusinessId;

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
      userId: USER,
      fecha: '2026-05-09',
      montoAperturaCentavos: 5000n,
      businessId: BIZ,
    });
    await expect(
      useCase.execute({
        userId: USER,
        fecha: '2026-05-09',
        montoAperturaCentavos: 3000n,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/turno abierto/);
  });

  it('accepts additional cash', async () => {
    const turno = await useCase.execute({
      userId: USER,
      fecha: '2026-05-09',
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

  // M-18, ADR-071 §3: one open turno per caja, whoever asks.
  it('refuses a second operator while the caja has an open turno', async () => {
    await useCase.execute({
      userId: USER,
      fecha: '2026-05-09',
      montoAperturaCentavos: 5000n,
      businessId: BIZ,
    });
    await expect(
      useCase.execute({
        userId: OTRO,
        fecha: '2026-05-09',
        montoAperturaCentavos: 3000n,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/Ya hay un turno abierto en esta caja/);
    expect(await turnos.findOpenByUser(OTRO)).toBeNull();
  });

  it('lets the second operator open once the caja turno is closed', async () => {
    const primero = await useCase.execute({
      userId: USER,
      fecha: '2026-05-09',
      montoAperturaCentavos: 5000n,
      businessId: BIZ,
    });
    await turnos.update(primero.id, {
      cierreAt: '2026-05-09T20:00:00.000Z',
      montoCierreCentavos: 5000n,
    });
    const segundo = await useCase.execute({
      userId: OTRO,
      fecha: '2026-05-09',
      montoAperturaCentavos: 5000n,
      businessId: BIZ,
    });
    expect(segundo.userId).toBe(OTRO);
  });

  it('does not count another business as this caja', async () => {
    await useCase.execute({
      userId: USER,
      fecha: '2026-05-09',
      montoAperturaCentavos: 5000n,
      businessId: OTRO_BIZ,
    });
    const turno = await useCase.execute({
      userId: OTRO,
      fecha: '2026-05-09',
      montoAperturaCentavos: 5000n,
      businessId: BIZ,
    });
    expect(turno.businessId).toBe(BIZ);
  });
});
