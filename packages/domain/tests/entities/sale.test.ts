import { describe, it, expect } from 'vitest';
import { SaleSchema, NewSaleSchema, SaleCategoryEnum } from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const SALE_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TER';
const PROD_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEZ';
const TICKET_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TKA';

const validLine = {
  id: SALE_ID,
  ticketId: TICKET_ID,
  fecha: '2026-04-23',
  concepto: 'Taco al pastor',
  categoria: 'Producto' as const,
  monto: 4500n,
  productoId: PROD_ID,
  cantidad: 1,
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdByUserId: null,
  createdAt: '2026-04-23T15:00:00.000Z',
  updatedAt: '2026-04-23T15:00:00.000Z',
  deletedAt: null,
};

describe('SaleSchema — a ticket line (ADR-073)', () => {
  it('accepts a well-formed line', () => {
    expect(() => SaleSchema.parse(validLine)).not.toThrow();
  });

  it('accepts a line of a fiado ticket naming its product and quantity', () => {
    expect(() =>
      SaleSchema.parse({ ...validLine, concepto: 'Quesadilla', cantidad: 3, monto: 9000n }),
    ).not.toThrow();
  });

  it('accepts every SaleCategory value', () => {
    for (const categoria of SaleCategoryEnum.options) {
      expect(() => SaleSchema.parse({ ...validLine, categoria })).not.toThrow();
    }
  });

  it('defaults cantidad to 1 when omitted', () => {
    const { cantidad: _drop, ...sinCantidad } = validLine;
    expect(SaleSchema.parse(sinCantidad).cantidad).toBe(1);
  });

  it('rejects a line without its ticket', () => {
    const { ticketId: _drop, ...sinTicket } = validLine;
    expect(() => SaleSchema.parse(sinTicket)).toThrow();
  });

  it('rejects a malformed ticketId', () => {
    expect(() => SaleSchema.parse({ ...validLine, ticketId: 'V-0405' })).toThrow();
  });

  it('rejects a missing productoId on the line', () => {
    const { productoId: _drop, ...sinProducto } = validLine;
    expect(() => SaleSchema.parse(sinProducto)).toThrow();
  });
});

describe('NewSaleSchema', () => {
  it('accepts a minimal line input and defaults cantidad', () => {
    const parsed = NewSaleSchema.parse({
      ticketId: TICKET_ID,
      fecha: '2026-04-23',
      concepto: 'Taco al pastor',
      categoria: 'Producto',
      monto: 4500n,
      productoId: PROD_ID,
      businessId: BIZ_ID,
    });
    expect(parsed.cantidad).toBe(1);
  });

  it('rejects a missing productoId (required since ADR-048)', () => {
    expect(() =>
      NewSaleSchema.parse({
        ticketId: TICKET_ID,
        fecha: '2026-04-23',
        concepto: 'x',
        categoria: 'Producto',
        monto: 100n,
        businessId: BIZ_ID,
      }),
    ).toThrow();
  });
});
