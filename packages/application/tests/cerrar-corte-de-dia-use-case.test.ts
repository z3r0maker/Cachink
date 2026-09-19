import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, IsoDate } from '@xangarro/domain';
import {
  InMemoryDayClosesRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  InMemoryTicketsRepository,
  TEST_DEVICE_ID,
  makeNewExpense,
  makeNewSale,
  makeNewTicket,
} from '../../testing/src/index.js';
import { CerrarCorteDeDiaUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const TODAY = '2026-04-23' as IsoDate;

describe('CerrarCorteDeDiaUseCase', () => {
  let tickets: InMemoryTicketsRepository;
  let sales: InMemorySalesRepository;
  let expenses: InMemoryExpensesRepository;
  let closes: InMemoryDayClosesRepository;
  let useCase: CerrarCorteDeDiaUseCase;

  beforeEach(() => {
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    closes = new InMemoryDayClosesRepository(TEST_DEVICE_ID);
    tickets = new InMemoryTicketsRepository(TEST_DEVICE_ID);
    useCase = new CerrarCorteDeDiaUseCase(tickets, sales, expenses, closes);
  });

  it('computes esperado from today ventas/egresos and persists the corte', async () => {
    const __t = await tickets.create(
      makeNewTicket({ businessId: BIZ, metodo: 'Efectivo', fecha: TODAY }),
    );
    await sales.create(
      makeNewSale({ businessId: BIZ, monto: 30_000n, fecha: TODAY, ticketId: __t.id }),
    );
    await expenses.create(makeNewExpense({ businessId: BIZ, monto: 5_000n, fecha: TODAY }));
    const corte = await useCase.execute({
      fecha: TODAY,
      businessId: BIZ,
      deviceId: TEST_DEVICE_ID,
      efectivoContadoCentavos: 25_000n,
      cerradoPor: 'Operativo',
    });
    expect(corte.efectivoEsperadoCentavos).toBe(25_000n); // 0 + 30000 − 5000
    expect(corte.diferenciaCentavos).toBe(0n);
  });

  it('uses the previous corte as saldoAnterior', async () => {
    await closes.create({
      fecha: '2026-04-22' as IsoDate,
      efectivoEsperadoCentavos: 100_000n,
      efectivoContadoCentavos: 100_000n,
      cerradoPor: 'Operativo',
      businessId: BIZ,
    });
    const __t = await tickets.create(
      makeNewTicket({ businessId: BIZ, metodo: 'Efectivo', fecha: TODAY }),
    );
    await sales.create(
      makeNewSale({ businessId: BIZ, monto: 20_000n, fecha: TODAY, ticketId: __t.id }),
    );
    const corte = await useCase.execute({
      fecha: TODAY,
      businessId: BIZ,
      deviceId: TEST_DEVICE_ID,
      efectivoContadoCentavos: 120_000n,
      cerradoPor: 'Operativo',
    });
    expect(corte.efectivoEsperadoCentavos).toBe(120_000n); // 100000 + 20000
    expect(corte.diferenciaCentavos).toBe(0n);
  });

  it('ignores non-Efectivo ventas in esperado', async () => {
    const __t = await tickets.create(
      makeNewTicket({ businessId: BIZ, metodo: 'Transferencia', fecha: TODAY }),
    );
    await sales.create(
      makeNewSale({ businessId: BIZ, monto: 999_999n, fecha: TODAY, ticketId: __t.id }),
    );
    const corte = await useCase.execute({
      fecha: TODAY,
      businessId: BIZ,
      deviceId: TEST_DEVICE_ID,
      efectivoContadoCentavos: 0n,
      cerradoPor: 'Operativo',
    });
    expect(corte.efectivoEsperadoCentavos).toBe(0n);
  });

  it('rejects if a corte for (fecha, deviceId) already exists', async () => {
    await useCase.execute({
      fecha: TODAY,
      businessId: BIZ,
      deviceId: TEST_DEVICE_ID,
      efectivoContadoCentavos: 0n,
      cerradoPor: 'Operativo',
    });
    await expect(
      useCase.execute({
        fecha: TODAY,
        businessId: BIZ,
        deviceId: TEST_DEVICE_ID,
        efectivoContadoCentavos: 0n,
        cerradoPor: 'Operativo',
      }),
    ).rejects.toThrow(/Ya existe un corte/);
  });

  it('surfaces a negative diferencia when contado < esperado', async () => {
    const __t = await tickets.create(
      makeNewTicket({ businessId: BIZ, metodo: 'Efectivo', fecha: TODAY }),
    );
    await sales.create(
      makeNewSale({ businessId: BIZ, monto: 10_000n, fecha: TODAY, ticketId: __t.id }),
    );
    const corte = await useCase.execute({
      fecha: TODAY,
      businessId: BIZ,
      deviceId: TEST_DEVICE_ID,
      efectivoContadoCentavos: 9_500n,
      cerradoPor: 'Operativo',
    });
    expect(corte.diferenciaCentavos).toBe(-500n);
  });
});
