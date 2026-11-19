import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, IsoDate } from '@xangarro/domain';
import {
  InMemoryExpensesRepository,
  InMemoryRecurringExpensesRepository,
  TEST_DEVICE_ID,
  makeNewRecurringExpense,
} from '../../testing/src/index.js';
import { ProcesarGastoRecurrenteUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

async function seedTemplate(
  recurring: InMemoryRecurringExpensesRepository,
  overrides: Parameters<typeof makeNewRecurringExpense>[0] = {},
) {
  return recurring.create(makeNewRecurringExpense({ businessId: BIZ, ...overrides }));
}

describe('ProcesarGastoRecurrenteUseCase', () => {
  let expenses: InMemoryExpensesRepository;
  let recurring: InMemoryRecurringExpensesRepository;
  let useCase: ProcesarGastoRecurrenteUseCase;

  beforeEach(() => {
    expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    recurring = new InMemoryRecurringExpensesRepository(TEST_DEVICE_ID);
    useCase = new ProcesarGastoRecurrenteUseCase(expenses, recurring);
  });

  it('mensual: advances proximoDisparo by one month keeping diaDelMes', async () => {
    const template = await seedTemplate(recurring, {
      frecuencia: 'mensual',
      diaDelMes: 1,
      proximoDisparo: '2026-04-01' as IsoDate,
    });
    const result = await useCase.execute({
      template,
      today: '2026-04-23' as IsoDate,
    });
    expect(result.processed).toBe(true);
    expect(result.nextProximoDisparo).toBe('2026-05-01');
    expect(result.egreso?.categoria).toBe(template.categoria);
    expect(result.egreso?.gastoRecurrenteId).toBe(template.id);
  });

  it('records what the caja captured (amount, concept, turno) and still advances', async () => {
    const template = await seedTemplate(recurring, {
      frecuencia: 'semanal',
      proximoDisparo: '2026-04-20' as IsoDate,
    });
    const turno = '01HZ8XQN9GZJXV8AKQ5X0C7TRN' as never;
    const result = await useCase.execute({
      template,
      today: '2026-04-23' as IsoDate,
      captura: { concepto: 'Gas del local', monto: 65_000n, proveedor: null, cajaTurnoId: turno },
    });
    expect(result.processed).toBe(true);
    expect(result.nextProximoDisparo).toBe('2026-04-27');
    expect(result.egreso?.concepto).toBe('Gas del local');
    expect(result.egreso?.monto).toBe(65_000n);
    expect(result.egreso?.categoria).toBe(template.categoria);
    expect(result.egreso?.cajaTurnoId).toBe(turno);
    expect(result.egreso?.proveedor ?? null).toBe(null);
    expect(result.egreso?.gastoRecurrenteId).toBe(template.id);
  });

  it('mensual: clamps 31 → end of shorter month', async () => {
    const template = await seedTemplate(recurring, {
      frecuencia: 'mensual',
      diaDelMes: 31,
      proximoDisparo: '2026-01-31' as IsoDate,
    });
    const result = await useCase.execute({
      template,
      today: '2026-02-15' as IsoDate,
    });
    expect(result.nextProximoDisparo).toBe('2026-02-28');
  });

  it('semanal: advances by 7 days', async () => {
    const template = await seedTemplate(recurring, {
      frecuencia: 'semanal',
      diaDeLaSemana: 1,
      proximoDisparo: '2026-04-20' as IsoDate,
    });
    const result = await useCase.execute({
      template,
      today: '2026-04-23' as IsoDate,
    });
    expect(result.nextProximoDisparo).toBe('2026-04-27');
  });

  it('quincenal: advances by 15 days', async () => {
    const template = await seedTemplate(recurring, {
      frecuencia: 'quincenal',
      diaDelMes: 15,
      proximoDisparo: '2026-04-15' as IsoDate,
    });
    const result = await useCase.execute({
      template,
      today: '2026-04-23' as IsoDate,
    });
    expect(result.nextProximoDisparo).toBe('2026-04-30');
  });

  it('inactive templates are skipped with processed=false (no egreso, no markFired)', async () => {
    const template = await seedTemplate(recurring, {
      proximoDisparo: '2026-04-01' as IsoDate,
      activo: false,
    });
    const result = await useCase.execute({ template, today: '2026-04-23' as IsoDate });
    expect(result).toEqual({ processed: false, egreso: null, nextProximoDisparo: null });
    const reloaded = await recurring.findById(template.id);
    expect(reloaded?.proximoDisparo).toBe(template.proximoDisparo);
  });

  it('templates whose proximoDisparo > today are skipped', async () => {
    const template = await seedTemplate(recurring, {
      proximoDisparo: '2026-05-01' as IsoDate,
    });
    const result = await useCase.execute({ template, today: '2026-04-23' as IsoDate });
    expect(result.processed).toBe(false);
  });

  it('crosses year boundary correctly (Dec → Jan)', async () => {
    const template = await seedTemplate(recurring, {
      frecuencia: 'mensual',
      diaDelMes: 1,
      proximoDisparo: '2026-12-01' as IsoDate,
    });
    const result = await useCase.execute({
      template,
      today: '2026-12-15' as IsoDate,
    });
    expect(result.nextProximoDisparo).toBe('2027-01-01');
  });

  it('two months behind: the second is paid the same day and the schedule catches up', async () => {
    await seedTemplate(recurring, { diaDelMes: 1, proximoDisparo: '2026-10-01' as IsoDate });
    const [seeded] = await recurring.findDue('2026-11-19' as IsoDate, BIZ);
    const today = '2026-11-19' as IsoDate;
    const octubre = await useCase.execute({ template: seeded!, today });
    expect(octubre.nextProximoDisparo).toBe('2026-11-01');
    const fresh = await recurring.findById(seeded!.id);
    const noviembre = await useCase.execute({ template: fresh!, today });
    expect(noviembre.processed).toBe(true);
    expect(noviembre.egreso?.id).not.toBe(octubre.egreso?.id);
    expect(noviembre.nextProximoDisparo).toBe('2026-12-01');
    expect(await recurring.findDue(today, BIZ)).toEqual([]);
    expect(await expenses.findByDateRange(today, today, BIZ)).toHaveLength(2);
  });

  it('a repeat with the same stale template records once and advances once', async () => {
    const template = await seedTemplate(recurring, { proximoDisparo: '2026-10-01' as IsoDate });
    const today = '2026-11-19' as IsoDate;
    const first = await useCase.execute({ template, today });
    const again = await useCase.execute({ template, today });
    expect(again.processed).toBe(true);
    expect(again.egreso?.id).toBe(first.egreso?.id);
    expect(again.nextProximoDisparo).toBe(null);
    expect((await recurring.findById(template.id))?.proximoDisparo).toBe('2026-11-01');
    expect(await expenses.findByDateRange(today, today, BIZ)).toHaveLength(1);
  });
});
