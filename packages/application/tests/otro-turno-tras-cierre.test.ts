/**
 * ADR-147: a closed turno is final, and keeping on selling is another turno.
 * The close → open cycle has no daily limit for the same operator, each
 * cycle leaves its own corte untouched, and nothing writes a closed turno
 * again. Happy path + 3 unhappy paths per CLAUDE.md §8.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, CajaTurnoId, UserId } from '@xangarro/domain';
import {
  InMemoryCajaTurnosRepository,
  InMemoryClientPaymentsRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  InMemoryTicketsRepository,
  TEST_DEVICE_ID,
} from '../../testing/src/index.js';
import { AbrirCajaUseCase, CerrarCajaUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0C7SR1' as UserId;
const FECHA = '2026-11-18';

describe('Otro turno tras el cierre (ADR-147)', () => {
  let turnos: InMemoryCajaTurnosRepository;
  let abrir: AbrirCajaUseCase;
  let cerrar: CerrarCajaUseCase;

  beforeEach(() => {
    turnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
    abrir = new AbrirCajaUseCase(turnos);
    cerrar = new CerrarCajaUseCase(
      turnos,
      new InMemoryTicketsRepository(TEST_DEVICE_ID),
      new InMemorySalesRepository(TEST_DEVICE_ID),
      new InMemoryExpensesRepository(TEST_DEVICE_ID),
      new InMemoryClientPaymentsRepository(TEST_DEVICE_ID),
    );
  });

  const abrirCon = (fondo: bigint) =>
    abrir.execute({ userId: USER, fecha: FECHA, montoAperturaCentavos: fondo, businessId: BIZ });

  const cerrarCuadrado = (turnoId: CajaTurnoId, monto: bigint) =>
    cerrar.execute({
      turnoId,
      montoCierreCentavos: monto,
      discrepancyReason: null,
      explicacion: null,
      businessId: BIZ,
    });

  it('the same operator closes and opens again, three times in one day', async () => {
    const ids: CajaTurnoId[] = [];
    let fondo = 50000n;
    for (let i = 0; i < 3; i += 1) {
      const t = await abrirCon(fondo);
      ids.push(t.id);
      const cerrado = await cerrarCuadrado(t.id, fondo);
      expect(cerrado.cierreAt).not.toBeNull();
      // The counted cash is the next turno's suggested fondo.
      fondo = cerrado.montoCierreCentavos ?? 0n;
    }
    expect(new Set(ids).size).toBe(3);
    expect(await turnos.findOpenByUser(USER)).toBeNull();
  });

  it('opening another turno leaves the closed corte exactly as it was', async () => {
    const primero = await abrirCon(50000n);
    const corte = await cerrarCuadrado(primero.id, 50000n);
    const otro = await abrirCon(50000n);
    expect(otro.id).not.toBe(primero.id);
    expect(await turnos.findById(primero.id)).toEqual(corte);
  });

  it('a closed turno cannot be closed again, and keeps its first count', async () => {
    const t = await abrirCon(50000n);
    const corte = await cerrarCuadrado(t.id, 50000n);
    await expect(cerrarCuadrado(t.id, 90000n)).rejects.toThrow(/ya fue cerrado/);
    expect(await turnos.findById(t.id)).toEqual(corte);
  });

  it('the old turno stays closed after another one opened', async () => {
    const t = await abrirCon(50000n);
    await cerrarCuadrado(t.id, 50000n);
    await abrirCon(50000n);
    await expect(cerrarCuadrado(t.id, 50000n)).rejects.toThrow(/ya fue cerrado/);
  });

  it('another turno is refused while the new one is still open', async () => {
    const t = await abrirCon(50000n);
    await cerrarCuadrado(t.id, 50000n);
    await abrirCon(50000n);
    await expect(abrirCon(50000n)).rejects.toThrow(/turno abierto/);
  });
});
