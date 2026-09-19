import { describe, it, expect } from 'vitest';
import { TicketSchema } from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const TKT_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TK1';
const CLI_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TCA';
const TURNO_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TCB';

const validTicket = {
  id: TKT_ID,
  folio: 405,
  fecha: '2026-05-14',
  hora: '13:45',
  concepto: 'Venta mostrador',
  metodo: 'Efectivo' as const,
  clienteId: null,
  estadoPago: 'pagado' as const,
  efectivoRecibidoCentavos: 20_000n,
  cambioCentavos: 4_000n,
  cajaTurnoId: TURNO_ID,
  cancelMotivo: null,
  cancelledByUserId: null,
  cancelledAt: null,
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdByUserId: null,
  createdAt: '2026-05-14T18:45:00.000Z',
  updatedAt: '2026-05-14T18:45:00.000Z',
  deletedAt: null,
};

describe('TicketSchema', () => {
  it('accepts a well-formed cash ticket with change', () => {
    expect(() => TicketSchema.parse(validTicket)).not.toThrow();
  });

  it('accepts a fiado ticket naming its client and turno', () => {
    expect(() =>
      TicketSchema.parse({
        ...validTicket,
        metodo: 'Crédito',
        clienteId: CLI_ID,
        estadoPago: 'pendiente',
      }),
    ).not.toThrow();
  });

  it('accepts a cancelled ticket carrying who, why and when', () => {
    expect(() =>
      TicketSchema.parse({
        ...validTicket,
        cancelMotivo: 'Cliente cambió de opinión',
        cancelledByUserId: '01HZ8XQN9GZJXV8AKQ5X0C7TCC',
        cancelledAt: '2026-05-14T19:00:00.000Z',
      }),
    ).not.toThrow();
  });

  it('rejects a Crédito ticket without a client', () => {
    expect(() =>
      TicketSchema.parse({ ...validTicket, metodo: 'Crédito', estadoPago: 'pendiente' }),
    ).toThrow();
  });

  it('rejects a folio that is not a positive integer', () => {
    expect(() => TicketSchema.parse({ ...validTicket, folio: 0 })).toThrow();
    expect(() => TicketSchema.parse({ ...validTicket, folio: 40.5 })).toThrow();
  });

  it('rejects an unknown metodo', () => {
    expect(() => TicketSchema.parse({ ...validTicket, metodo: 'Bitcoin' })).toThrow();
  });
});
