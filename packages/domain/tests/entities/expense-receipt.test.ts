import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  EXPENSE_RECEIPT_SIDE,
  ExpenseReceiptSchema,
  MAX_EXPENSE_RECEIPT_BYTES,
  NewExpenseReceiptSchema,
  latestExpenseReceipts,
  type ExpenseReceipt,
} from '../../src/entities/index.js';
import { ExpenseReceiptTooLargeError } from '../../src/errors/expense-receipt-errors.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const GASTO = '01HZ8XQN9GZJXV8AKQ5X0C7GST';
const OTRO = '01HZ8XQN9GZJXV8AKQ5X0C7GSZ';
const R_A = '01HZ8XQN9GZJXV8AKQ5X0C7RCA';
const R_B = '01HZ8XQN9GZJXV8AKQ5X0C7RCB';

/** A base64 string that decodes to exactly `bytes` bytes. */
const base64Of = (bytes: number): string => Buffer.alloc(bytes, 7).toString('base64');

const receipt = {
  id: R_A,
  gastoId: GASTO,
  mime: 'image/webp' as const,
  bytes: base64Of(60_000),
  width: 768,
  height: 1024,
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdAt: '2026-11-19T16:05:00.000Z',
  updatedAt: '2026-11-19T16:05:00.000Z',
  deletedAt: null,
};

describe('ExpenseReceiptSchema (ADR-149)', () => {
  it('accepts a portrait grayscale WebP up to 1024 px and 96 KB', () => {
    const r = ExpenseReceiptSchema.parse(receipt);
    assert.equal(r.height, EXPENSE_RECEIPT_SIDE);
    assert.equal(MAX_EXPENSE_RECEIPT_BYTES, 98_304);
    const max = ExpenseReceiptSchema.parse({ ...receipt, bytes: base64Of(98_304) });
    assert.equal(max.gastoId, GASTO);
  });

  it('refuses bytes over 96 KB', () => {
    assert.throws(() => ExpenseReceiptSchema.parse({ ...receipt, bytes: base64Of(98_305) }));
  });

  it('refuses a side over 1024 px and any format but WebP', () => {
    assert.throws(() => ExpenseReceiptSchema.parse({ ...receipt, height: 1025 }));
    assert.throws(() => ExpenseReceiptSchema.parse({ ...receipt, mime: 'image/jpeg' }));
  });

  it('has no tombstone: a receipt always carries its bytes and size', () => {
    assert.throws(() => ExpenseReceiptSchema.parse({ ...receipt, bytes: null }));
    assert.throws(() =>
      NewExpenseReceiptSchema.parse({ gastoId: GASTO, businessId: BIZ_ID, bytes: 'x' }),
    );
  });
});

describe('latestExpenseReceipts', () => {
  const rows: ExpenseReceipt[] = [
    ExpenseReceiptSchema.parse(receipt),
    ExpenseReceiptSchema.parse({ ...receipt, id: R_B, createdAt: '2026-11-19T16:06:00.000Z' }),
    ExpenseReceiptSchema.parse({ ...receipt, id: '01HZ8XQN9GZJXV8AKQ5X0C7RCC', gastoId: OTRO }),
  ];

  it('keeps the newest receipt per gasto', () => {
    const m = latestExpenseReceipts(rows);
    assert.equal(m.get(GASTO as never)?.id, R_B);
    assert.equal(m.size, 2);
  });

  it('breaks a same-millisecond tie by the greater id, and skips deleted rows', () => {
    const tie = [rows[0]!, ExpenseReceiptSchema.parse({ ...receipt, id: R_B })];
    assert.equal(latestExpenseReceipts(tie).get(GASTO as never)?.id, R_B);
    const borrada = ExpenseReceiptSchema.parse({
      ...receipt,
      deletedAt: '2026-11-19T17:00:00.000Z',
    });
    assert.equal(latestExpenseReceipts([borrada]).size, 0);
  });
});

describe('ExpenseReceiptTooLargeError', () => {
  it('carries its code and says the limit in Spanish', () => {
    const e = new ExpenseReceiptTooLargeError(120_000);
    assert.equal(e.code, 'EXPENSE_RECEIPT_TOO_LARGE');
    assert.match(e.message, /Toma otra/);
  });
});
