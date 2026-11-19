import { describe, it, expect } from 'vitest';
import { ClientPaymentSchema, NewClientPaymentSchema } from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const PAY_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TF3';
const CLI_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TF4';

const validPayment = {
  id: PAY_ID,
  clienteId: CLI_ID,
  fecha: '2026-04-23',
  montoCentavos: 50_000n,
  metodo: 'Efectivo' as const,
  nota: null,
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdAt: '2026-04-23T15:00:00.000Z',
  updatedAt: '2026-04-23T15:00:00.000Z',
  deletedAt: null,
};

describe('ClientPaymentSchema', () => {
  it('accepts a well-formed payment', () => {
    expect(() => ClientPaymentSchema.parse(validPayment)).not.toThrow();
  });

  it('defaults the turno to none for a row written before ADR-146', () => {
    expect(ClientPaymentSchema.parse(validPayment).cajaTurnoId).toBeNull();
  });

  it('keeps the turno that received the abono (ADR-146)', () => {
    const turno = '01HZ8XQN9GZJXV8AKQ5X0C7TF5';
    expect(ClientPaymentSchema.parse({ ...validPayment, cajaTurnoId: turno }).cajaTurnoId).toBe(
      turno,
    );
  });

  it('rejects a turno that is not a ULID', () => {
    expect(() => ClientPaymentSchema.parse({ ...validPayment, cajaTurnoId: 'turno-1' })).toThrow();
  });

  it('lets a new abono carry its turno, or leave it out', () => {
    const base = {
      clienteId: CLI_ID,
      fecha: '2026-04-23',
      montoCentavos: 50_000n,
      metodo: 'Efectivo' as const,
      businessId: BIZ_ID,
    };
    expect(NewClientPaymentSchema.parse(base).cajaTurnoId).toBeUndefined();
    const turno = '01HZ8XQN9GZJXV8AKQ5X0C7TF5';
    expect(NewClientPaymentSchema.parse({ ...base, cajaTurnoId: turno }).cajaTurnoId).toBe(turno);
  });

  it('accepts all five PaymentMethod values', () => {
    for (const metodo of ['Efectivo', 'Transferencia', 'Tarjeta', 'QR/CoDi', 'Crédito'] as const) {
      expect(() => ClientPaymentSchema.parse({ ...validPayment, metodo })).not.toThrow();
    }
  });

  it('accepts a payment with a short nota', () => {
    expect(() =>
      ClientPaymentSchema.parse({
        ...validPayment,
        nota: 'Pago con transferencia BBVA',
      }),
    ).not.toThrow();
  });

  it('rejects an unknown metodo', () => {
    expect(() => ClientPaymentSchema.parse({ ...validPayment, metodo: 'Bitcoin' })).toThrow();
  });

  it('rejects a malformed ventaId', () => {
    expect(() => ClientPaymentSchema.parse({ ...validPayment, clienteId: 'nope' })).toThrow();
  });

  it('rejects a monto as a plain number', () => {
    expect(() =>
      ClientPaymentSchema.parse({
        ...validPayment,
        montoCentavos: 50_000 as unknown as bigint,
      }),
    ).toThrow();
  });
});

describe('NewClientPaymentSchema', () => {
  it('accepts a minimal input', () => {
    expect(() =>
      NewClientPaymentSchema.parse({
        clienteId: CLI_ID,
        fecha: '2026-04-23',
        montoCentavos: 50_000n,
        metodo: 'Efectivo',
        businessId: BIZ_ID,
      }),
    ).not.toThrow();
  });
});
