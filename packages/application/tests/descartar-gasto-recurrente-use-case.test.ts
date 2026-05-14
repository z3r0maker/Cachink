import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, IsoDate } from '@cachink/domain';
import {
  InMemoryRecurringExpensesRepository,
  TEST_DEVICE_ID,
  makeNewRecurringExpense,
} from '../../testing/src/index.js';
import { DescartarGastoRecurrenteUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

async function seedTemplate(
  recurring: InMemoryRecurringExpensesRepository,
  overrides: Parameters<typeof makeNewRecurringExpense>[0] = {},
) {
  return recurring.create(makeNewRecurringExpense({ businessId: BIZ, ...overrides }));
}

describe('DescartarGastoRecurrenteUseCase', () => {
  let recurring: InMemoryRecurringExpensesRepository;
  let useCase: DescartarGastoRecurrenteUseCase;

  beforeEach(() => {
    recurring = new InMemoryRecurringExpensesRepository(TEST_DEVICE_ID);
    useCase = new DescartarGastoRecurrenteUseCase(recurring);
  });

  it('advances proximoDisparo without creating an egreso (mensual)', async () => {
    const template = await seedTemplate(recurring, {
      frecuencia: 'mensual',
      diaDelMes: 1,
      proximoDisparo: '2026-04-01' as IsoDate,
    });
    const result = await useCase.execute({ template, today: '2026-04-23' as IsoDate });
    expect(result.skipped).toBe(false);
    expect(result.nextProximoDisparo).toBe('2026-05-01');
    const reloaded = await recurring.findById(template.id);
    expect(reloaded?.proximoDisparo).toBe('2026-05-01');
  });

  it('advances proximoDisparo for semanal templates', async () => {
    const template = await seedTemplate(recurring, {
      frecuencia: 'semanal',
      diaDeLaSemana: 1,
      proximoDisparo: '2026-04-20' as IsoDate,
    });
    const result = await useCase.execute({ template, today: '2026-04-23' as IsoDate });
    expect(result.skipped).toBe(false);
    expect(result.nextProximoDisparo).toBe('2026-04-27');
  });

  it('skips inactive templates', async () => {
    const template = await seedTemplate(recurring, {
      proximoDisparo: '2026-04-01' as IsoDate,
      activo: false,
    });
    const result = await useCase.execute({ template, today: '2026-04-23' as IsoDate });
    expect(result).toEqual({ skipped: true, nextProximoDisparo: null });
    const reloaded = await recurring.findById(template.id);
    expect(reloaded?.proximoDisparo).toBe(template.proximoDisparo);
  });

  it('skips templates whose proximoDisparo > today', async () => {
    const template = await seedTemplate(recurring, {
      proximoDisparo: '2026-05-01' as IsoDate,
    });
    const result = await useCase.execute({ template, today: '2026-04-23' as IsoDate });
    expect(result).toEqual({ skipped: true, nextProximoDisparo: null });
  });
});
