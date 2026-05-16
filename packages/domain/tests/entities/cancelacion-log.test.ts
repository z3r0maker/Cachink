import { describe, it, expect } from 'vitest';
import {
  CancelacionLogSchema,
  NewCancelacionLogSchema,
} from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const SALE_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEQ';
const USER_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TER';
const LOG_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TES';
const PROD_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEZ';

const validLog = {
  id: LOG_ID,
  saleId: SALE_ID,
  cancelledByUserId: USER_ID,
  motivo: 'Cliente cambió de opinión',
  montoOriginalCentavos: 6500n,
  metodoOriginal: 'Efectivo' as const,
  cashReturnedCentavos: 6500n,
  stockReversed: true,
  cantidadDevuelta: 1,
  productoId: PROD_ID,
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdAt: '2026-04-23T16:00:00.000Z',
  updatedAt: '2026-04-23T16:00:00.000Z',
  deletedAt: null,
};

describe('CancelacionLogSchema', () => {
  it('accepts a well-formed cancellation log', () => {
    expect(() => CancelacionLogSchema.parse(validLog)).not.toThrow();
  });

  it('accepts log without stock reversal', () => {
    expect(() =>
      CancelacionLogSchema.parse({
        ...validLog,
        stockReversed: false,
        cantidadDevuelta: null,
        productoId: null,
      }),
    ).not.toThrow();
  });

  it('accepts log for non-cash method (no cash returned)', () => {
    expect(() =>
      CancelacionLogSchema.parse({
        ...validLog,
        metodoOriginal: 'Tarjeta',
        cashReturnedCentavos: null,
      }),
    ).not.toThrow();
  });

  it('rejects empty motivo', () => {
    expect(() =>
      CancelacionLogSchema.parse({ ...validLog, motivo: '' }),
    ).toThrow();
  });

  it('rejects motivo longer than 500 chars', () => {
    expect(() =>
      CancelacionLogSchema.parse({
        ...validLog,
        motivo: 'x'.repeat(501),
      }),
    ).toThrow();
  });

  it('rejects non-bigint montoOriginalCentavos', () => {
    expect(() =>
      CancelacionLogSchema.parse({
        ...validLog,
        montoOriginalCentavos: 6500,
      }),
    ).toThrow();
  });

  it('rejects unknown metodoOriginal', () => {
    expect(() =>
      CancelacionLogSchema.parse({
        ...validLog,
        metodoOriginal: 'Bitcoin',
      }),
    ).toThrow();
  });
});

describe('NewCancelacionLogSchema', () => {
  it('accepts valid input', () => {
    expect(() =>
      NewCancelacionLogSchema.parse({
        saleId: SALE_ID,
        cancelledByUserId: USER_ID,
        motivo: 'Test',
        montoOriginalCentavos: 5000n,
        metodoOriginal: 'Efectivo',
        businessId: BIZ_ID,
      }),
    ).not.toThrow();
  });

  it('defaults optional fields', () => {
    const parsed = NewCancelacionLogSchema.parse({
      saleId: SALE_ID,
      cancelledByUserId: USER_ID,
      motivo: 'Test',
      montoOriginalCentavos: 5000n,
      metodoOriginal: 'Efectivo',
      businessId: BIZ_ID,
    });
    expect(parsed.cashReturnedCentavos).toBeNull();
    expect(parsed.stockReversed).toBe(false);
    expect(parsed.cantidadDevuelta).toBeNull();
    expect(parsed.productoId).toBeNull();
  });
});
