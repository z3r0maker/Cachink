import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ExpenseId } from '@cachink/domain';
import {
  InMemoryExpensesRepository,
  TEST_DEVICE_ID,
  makeNewExpense,
} from '../../testing/src/index.js';
import { EditarEgresoUseCase, RegistrarEgresoUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('EditarEgresoUseCase', () => {
  let expenses: InMemoryExpensesRepository;
  let registrar: RegistrarEgresoUseCase;
  let editar: EditarEgresoUseCase;

  beforeEach(() => {
    expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    registrar = new RegistrarEgresoUseCase(expenses);
    editar = new EditarEgresoUseCase(expenses);
  });

  it('applies a monto + proveedor patch', async () => {
    const egreso = await registrar.execute(makeNewExpense({ businessId: BIZ, monto: 1000n }));
    const updated = await editar.execute({
      id: egreso.id,
      patch: { monto: 4500n, proveedor: 'Walmart' },
    });
    expect(updated.monto).toBe(4500n);
    expect(updated.proveedor).toBe('Walmart');
  });

  it('preserves untouched fields', async () => {
    const egreso = await registrar.execute(makeNewExpense({ businessId: BIZ }));
    const updated = await editar.execute({
      id: egreso.id,
      patch: { monto: 9999n },
    });
    expect(updated.fecha).toBe(egreso.fecha);
    expect(updated.categoria).toBe(egreso.categoria);
    expect(updated.concepto).toBe(egreso.concepto);
  });

  it('throws when the egreso does not exist', async () => {
    await expect(
      editar.execute({
        id: '01HZ8XQN9GZJXV8AKQ5X0CZZZZ' as ExpenseId,
        patch: { monto: 1n },
      }),
    ).rejects.toThrow(/no existe/);
  });

  it('Zod rejects an empty concepto', async () => {
    const egreso = await registrar.execute(makeNewExpense({ businessId: BIZ }));
    await expect(editar.execute({ id: egreso.id, patch: { concepto: '' } })).rejects.toThrow();
  });

  it('keeps gastoRecurrenteId provenance untouched', async () => {
    const egreso = await registrar.execute(makeNewExpense({ businessId: BIZ }));
    const updated = await editar.execute({
      id: egreso.id,
      patch: { proveedor: 'Tienda nueva' },
    });
    expect(updated.gastoRecurrenteId).toBe(egreso.gastoRecurrenteId);
  });
});
