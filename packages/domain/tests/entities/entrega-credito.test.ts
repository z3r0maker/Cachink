import { describe, expect, it } from 'vitest';
import { EntregaCreditoSchema } from '../../src/entities/entrega-credito.js';

const VALID_ULID = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const VALID_ULID2 = '01HZ8XQN9GZJXV8AKQ5X0C7BK1';
const VALID_AUDIT = {
  businessId: VALID_ULID,
  deviceId: VALID_ULID,
  createdAt: '2026-05-09T12:00:00.000Z',
  updatedAt: '2026-05-09T12:00:00.000Z',
  deletedAt: null,
};

describe('EntregaCreditoSchema', () => {
  it('validates a complete entrega record', () => {
    const result = EntregaCreditoSchema.safeParse({
      id: VALID_ULID,
      clienteId: VALID_ULID2,
      fecha: '2026-05-09',
      totalCentavos: BigInt(15000),
      nota: 'Entrega parcial mayo',
      saleIds: '["01HZ8XQN9GZJXV8AKQ5X0C7BJZ"]',
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required clienteId field', () => {
    const result = EntregaCreditoSchema.safeParse({
      id: VALID_ULID,
      fecha: '2026-05-09',
      totalCentavos: BigInt(15000),
      nota: null,
      saleIds: '[]',
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid branded ID', () => {
    const result = EntregaCreditoSchema.safeParse({
      id: 'bad-id',
      clienteId: VALID_ULID2,
      fecha: '2026-05-09',
      totalCentavos: BigInt(15000),
      nota: null,
      saleIds: '[]',
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid fecha format', () => {
    const result = EntregaCreditoSchema.safeParse({
      id: VALID_ULID,
      clienteId: VALID_ULID2,
      fecha: '09/05/2026',
      totalCentavos: BigInt(15000),
      nota: null,
      saleIds: '[]',
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(false);
  });
});
