import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  MAX_EXPENSE_RECEIPT_BYTES,
  type BusinessId,
  type Expense,
  type ExpenseId,
} from '@xangarro/domain';
import {
  InMemoryExpenseReceiptsRepository,
  InMemoryExpensesRepository,
  makeNewExpense,
} from '../../testing/src/index.js';
import { AgregarComprobanteGastoUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const OTHER_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJY' as BusinessId;
const UNKNOWN = '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as ExpenseId;

/** Base64 that decodes to exactly `bytes` bytes. */
const webpOf = (bytes: number): string => Buffer.alloc(bytes, 9).toString('base64');

const hasCode = (code: string) => (e: unknown) => (e as { code?: string }).code === code;

describe('AgregarComprobanteGastoUseCase (M-18)', () => {
  let expenses: InMemoryExpensesRepository;
  let receipts: InMemoryExpenseReceiptsRepository;
  let gasto: Expense;
  let agregar: AgregarComprobanteGastoUseCase;

  const foto = (over: Partial<{ gastoId: ExpenseId; businessId: BusinessId; bytes: string }>) => ({
    gastoId: gasto.id,
    businessId: BIZ,
    bytes: webpOf(40_000),
    width: 768,
    height: 1024,
    ...over,
  });

  beforeEach(async () => {
    expenses = new InMemoryExpensesRepository();
    receipts = new InMemoryExpenseReceiptsRepository();
    gasto = await expenses.create(makeNewExpense({ businessId: BIZ }));
    agregar = new AgregarComprobanteGastoUseCase(expenses, receipts);
  });

  it('saves the receipt on the gasto’s business, and it is the gasto’s receipt', async () => {
    const row = await agregar.execute(foto({}));
    assert.equal(row.gastoId, gasto.id);
    assert.equal(row.businessId, BIZ);
    assert.equal(row.mime, 'image/webp');
    assert.equal(row.width, 768);
    assert.deepEqual(await receipts.findLatestByGasto(gasto.id), row);
  });

  it('refuses a gasto that is not on this device, and writes nothing', async () => {
    await assert.rejects(agregar.execute(foto({ gastoId: UNKNOWN })), hasCode('EXPENSE_NOT_FOUND'));
    assert.equal(await receipts.findLatestByGasto(UNKNOWN), null);
  });

  it('refuses another business’s gasto as if it did not exist', async () => {
    await assert.rejects(
      agregar.execute(foto({ businessId: OTHER_BIZ })),
      hasCode('EXPENSE_NOT_FOUND'),
    );
    assert.equal(await receipts.findLatestByGasto(gasto.id), null);
  });

  it('refuses a gasto that already has its receipt, and keeps the first', async () => {
    const first = await agregar.execute(foto({}));
    await assert.rejects(
      agregar.execute(foto({ bytes: webpOf(10) })),
      (e: unknown) =>
        hasCode('EXPENSE_RECEIPT_EXISTS')(e) && (e as { gastoId: string }).gastoId === gasto.id,
    );
    assert.equal((await receipts.findLatestByGasto(gasto.id))?.id, first.id);
  });

  it('refuses bytes over the limit, saying how heavy they were', async () => {
    const heavy = MAX_EXPENSE_RECEIPT_BYTES + 1;
    await assert.rejects(
      agregar.execute(foto({ bytes: webpOf(heavy) })),
      (e: unknown) =>
        hasCode('EXPENSE_RECEIPT_TOO_LARGE')(e) && (e as { bytes: number }).bytes === heavy,
    );
    assert.equal(await receipts.findLatestByGasto(gasto.id), null);
  });

  it('refuses bytes that are not base64 or a side past 1024 px as unreadable', async () => {
    await assert.rejects(
      agregar.execute(foto({ bytes: 'no es base64!' })),
      hasCode('EXPENSE_RECEIPT_UNREADABLE'),
    );
    await assert.rejects(
      agregar.execute({ ...foto({}), width: 2048 }),
      hasCode('EXPENSE_RECEIPT_UNREADABLE'),
    );
    assert.equal(await receipts.findLatestByGasto(gasto.id), null);
  });
});
