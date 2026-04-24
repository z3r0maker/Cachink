import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, IsoDate } from '@cachink/domain';
import {
  InMemoryDayClosesRepository,
  InMemoryExpensesRepository,
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  makeNewExpense,
  makeNewSale,
} from '../../testing/src/index.js';
import { CerrarCorteDeDiaUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const TODAY = '2026-04-23' as IsoDate;

describe('CerrarCorteDeDiaUseCase', () => {
  let sales: InMemorySalesRepository;
  let expenses: InMemoryExpensesRepository;
  let closes: InMemoryDayClosesRepository;
  let useCase: CerrarCorteDeDiaUseCase;

  beforeEach(() => {
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    closes = new InMemoryDayClosesRepository(TEST_DEVICE_ID);
    useCase = new CerrarCorteDeDiaUseCase(sales, expenses, closes);
  });

  it('computes esperado from today ventas/egresos and persists the corte', async () => {
    await sales.create(makeNewSale({ businessId: BIZ, metodo: 'Efectivo', monto: 30_000n, fecha: TODAY }));
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
    await sales.create(makeNewSale({ businessId: BIZ, metodo: 'Efectivo', monto: 20_000n, fecha: TODAY }));
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
    await sales.create(makeNewSale({ businessId: BIZ, metodo: 'Transferencia', monto: 999_999n, fecha: TODAY }));
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
    await sales.create(makeNewSale({ businessId: BIZ, metodo: 'Efectivo', monto: 10_000n, fecha: TODAY }));
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
