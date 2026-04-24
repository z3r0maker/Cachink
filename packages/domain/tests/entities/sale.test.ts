import { describe, it, expect } from 'vitest';
import {
  SaleSchema,
  NewSaleSchema,
  PaymentMethodEnum,
  SaleCategoryEnum,
  PaymentStateEnum,
} from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const CLI_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEQ';
const SALE_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TER';

const validEfectivoSale = {
  id: SALE_ID,
  fecha: '2026-04-23',
  concepto: 'Taco al pastor',
  categoria: 'Producto' as const,
  monto: 4500n,
  metodo: 'Efectivo' as const,
  clienteId: null,
  estadoPago: 'pagado' as const,
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdAt: '2026-04-23T15:00:00.000Z',
  updatedAt: '2026-04-23T15:00:00.000Z',
  deletedAt: null,
};

describe('SaleSchema', () => {
  it('accepts a well-formed Efectivo sale with null clienteId', () => {
    expect(() => SaleSchema.parse(validEfectivoSale)).not.toThrow();
  });

  it('accepts a Crédito sale with a valid clienteId', () => {
    expect(() =>
      SaleSchema.parse({
        ...validEfectivoSale,
        metodo: 'Crédito',
        clienteId: CLI_ID,
        estadoPago: 'pendiente',
      }),
    ).not.toThrow();
  });

  it('accepts a parcial Crédito sale', () => {
    expect(() =>
      SaleSchema.parse({
        ...validEfectivoSale,
        metodo: 'Crédito',
        clienteId: CLI_ID,
        estadoPago: 'parcial',
      }),
    ).not.toThrow();
  });

  it('rejects a Crédito sale with null clienteId (cross-field refine)', () => {
    expect(() =>
      SaleSchema.parse({
        ...validEfectivoSale,
        metodo: 'Crédito',
        clienteId: null,
      }),
    ).toThrow(/Crédito requires clienteId/);
  });

  it('rejects a malformed ULID for id', () => {
    expect(() => SaleSchema.parse({ ...validEfectivoSale, id: 'not-a-ulid' })).toThrow();
  });

  it('rejects a missing concepto', () => {
    const { concepto: _c, ...rest } = validEfectivoSale;
    expect(() => SaleSchema.parse(rest)).toThrow();
  });

  it('rejects an empty concepto', () => {
    expect(() => SaleSchema.parse({ ...validEfectivoSale, concepto: '' })).toThrow();
  });

  it('rejects an unknown categoria value', () => {
    expect(() => SaleSchema.parse({ ...validEfectivoSale, categoria: 'Comida' })).toThrow();
  });

  it('rejects an unknown metodo value', () => {
    expect(() => SaleSchema.parse({ ...validEfectivoSale, metodo: 'Bitcoin' })).toThrow();
  });

  it('rejects monto as a plain number (must be bigint)', () => {
    expect(() => SaleSchema.parse({ ...validEfectivoSale, monto: 4500 })).toThrow();
  });

  it('rejects an invalid fecha format', () => {
    expect(() => SaleSchema.parse({ ...validEfectivoSale, fecha: '23/04/2026' })).toThrow();
  });
});

describe('NewSaleSchema', () => {
  it('accepts an input with all required fields and no clienteId', () => {
    expect(() =>
      NewSaleSchema.parse({
        fecha: '2026-04-23',
        concepto: 'Jugo verde',
        categoria: 'Producto',
        monto: 3500n,
        metodo: 'Efectivo',
        businessId: BIZ_ID,
      }),
    ).not.toThrow();
  });

  it('accepts an input with an optional clienteId', () => {
    expect(() =>
      NewSaleSchema.parse({
        fecha: '2026-04-23',
        concepto: 'Café americano',
        categoria: 'Producto',
        monto: 3500n,
        metodo: 'Crédito',
        clienteId: CLI_ID,
        businessId: BIZ_ID,
      }),
    ).not.toThrow();
  });

  it('rejects missing businessId', () => {
    expect(() =>
      NewSaleSchema.parse({
        fecha: '2026-04-23',
        concepto: 'X',
        categoria: 'Producto',
        monto: 3500n,
        metodo: 'Efectivo',
      }),
    ).toThrow();
  });
});

describe('Payment / category / state enums', () => {
  it('PaymentMethodEnum enumerates the five CLAUDE.md §9 methods', () => {
    expect(PaymentMethodEnum.options).toEqual([
      'Efectivo',
      'Transferencia',
      'Tarjeta',
      'QR/CoDi',
      'Crédito',
    ]);
  });

  it('SaleCategoryEnum enumerates the five VENTAS_CAT values', () => {
    expect(SaleCategoryEnum.options).toEqual([
      'Producto',
      'Servicio',
      'Anticipo',
      'Suscripción',
      'Otro',
    ]);
  });

  it('PaymentStateEnum enumerates pagado/pendiente/parcial', () => {
    expect(PaymentStateEnum.options).toEqual(['pagado', 'pendiente', 'parcial']);
  });
});
