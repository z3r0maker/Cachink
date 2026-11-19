/**
 * RegistrarEgresoUseCase with the «Comprobante (opcional)» row (M-18,
 * ADR-149): the receipt is checked before anything is written, so a refused
 * photo never leaves a gasto behind without the receipt the operator took.
 */

import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { MAX_EXPENSE_RECEIPT_BYTES, type BusinessId, type NewExpense } from '@xangarro/domain';
import {
  InMemoryExpenseReceiptsRepository,
  InMemoryExpensesRepository,
  InMemoryRecurringExpensesRepository,
  makeNewExpense,
} from '../../testing/src/index.js';
import { RegistrarEgresoUseCase, UNLIMITED_QUOTA } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

const webpOf = (bytes: number): string => Buffer.alloc(bytes, 9).toString('base64');
const hasCode = (code: string) => (e: unknown) => (e as { code?: string }).code === code;
const comprobante = (bytes = webpOf(40_000)) => ({ bytes, width: 768, height: 1024 });

describe('RegistrarEgresoUseCase · comprobante (M-18)', () => {
  let expenses: InMemoryExpensesRepository;
  let receipts: InMemoryExpenseReceiptsRepository;
  let useCase: RegistrarEgresoUseCase;
  let gasto: NewExpense;

  const gastosDelDia = async () => expenses.findByDate(gasto.fecha, BIZ);

  beforeEach(() => {
    expenses = new InMemoryExpensesRepository();
    receipts = new InMemoryExpenseReceiptsRepository();
    const recurring = new InMemoryRecurringExpensesRepository();
    useCase = new RegistrarEgresoUseCase(expenses, recurring, UNLIMITED_QUOTA, receipts);
    gasto = makeNewExpense({ businessId: BIZ });
  });

  it('saves the gasto and its receipt, the receipt naming the gasto', async () => {
    const row = await useCase.execute({ ...gasto, comprobante: comprobante() });
    const receipt = await receipts.findLatestByGasto(row.id);
    assert.equal(receipt?.businessId, BIZ);
    assert.equal(receipt?.width, 768);
    assert.equal(receipt?.bytes, comprobante().bytes);
    assert.equal(await expenses.findById(row.id).then((e) => e?.concepto), gasto.concepto);
  });

  it('a gasto with no comprobante saves alone, as before', async () => {
    const row = await useCase.execute({ ...gasto, comprobante: null });
    assert.equal((await receipts.findGastosWithReceipt([row.id])).size, 0);
    assert.equal((await gastosDelDia()).length, 1);
  });

  it('refuses a receipt over the limit before writing the gasto', async () => {
    const heavy = MAX_EXPENSE_RECEIPT_BYTES + 1;
    await assert.rejects(
      useCase.execute({ ...gasto, comprobante: comprobante(webpOf(heavy)) }),
      (e: unknown) =>
        hasCode('EXPENSE_RECEIPT_TOO_LARGE')(e) && (e as { bytes: number }).bytes === heavy,
    );
    assert.equal((await gastosDelDia()).length, 0);
  });

  it('refuses an unreadable receipt before writing the gasto', async () => {
    await assert.rejects(
      useCase.execute({ ...gasto, comprobante: { bytes: 'no es base64!', width: 0, height: 0 } }),
      hasCode('EXPENSE_RECEIPT_UNREADABLE'),
    );
    assert.equal((await gastosDelDia()).length, 0);
  });

  it('refuses a comprobante when it was built with nowhere to keep it', async () => {
    const sinFotos = new RegistrarEgresoUseCase(
      expenses,
      new InMemoryRecurringExpensesRepository(),
    );
    await assert.rejects(sinFotos.execute({ ...gasto, comprobante: comprobante() }), TypeError);
    assert.equal((await gastosDelDia()).length, 0);
  });

  it('an invalid gasto writes no receipt either', async () => {
    const malo = { ...gasto, categoria: 'NoExiste', comprobante: comprobante() };
    await assert.rejects(useCase.execute(malo as unknown as NewExpense));
    assert.equal((await gastosDelDia()).length, 0);
  });
});
