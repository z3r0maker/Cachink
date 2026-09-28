import { describe, it, expect } from 'vitest';
import { ClientSchema, NewClientSchema } from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const CLI_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TF2';

const validClient = {
  id: CLI_ID,
  nombre: 'Laura Hernández',
  telefono: '+52 33 1234 5678',
  email: 'laura@example.com',
  nota: null,
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdAt: '2026-04-23T15:00:00.000Z',
  updatedAt: '2026-04-23T15:00:00.000Z',
  deletedAt: null,
};

describe('ClientSchema', () => {
  it('accepts a well-formed Client', () => {
    expect(() => ClientSchema.parse(validClient)).not.toThrow();
  });

  it('accepts a Client with null telefono and email', () => {
    expect(() => ClientSchema.parse({ ...validClient, telefono: null, email: null })).not.toThrow();
  });

  it('accepts a Mexican mobile format "3312345678"', () => {
    expect(() => ClientSchema.parse({ ...validClient, telefono: '3312345678' })).not.toThrow();
  });

  it('rejects a short telefono', () => {
    expect(() => ClientSchema.parse({ ...validClient, telefono: '123' })).toThrow();
  });

  it('rejects a telefono with letters', () => {
    expect(() => ClientSchema.parse({ ...validClient, telefono: 'abcdefg' })).toThrow();
  });

  it('rejects a malformed email', () => {
    expect(() => ClientSchema.parse({ ...validClient, email: 'not-an-email' })).toThrow();
  });

  it('rejects an empty nombre', () => {
    expect(() => ClientSchema.parse({ ...validClient, nombre: '' })).toThrow();
  });
});

describe('NewClientSchema', () => {
  it('accepts an input with only nombre + businessId', () => {
    expect(() =>
      NewClientSchema.parse({
        nombre: 'Pedro Ramírez',
        businessId: BIZ_ID,
      }),
    ).not.toThrow();
  });

  it('leaves the credit line, term and fusion unsaid when omitted', () => {
    const n = NewClientSchema.parse({ nombre: 'Pedro', businessId: BIZ_ID });
    expect(n.limiteCentavos).toBeUndefined();
    expect(n.plazoDias).toBeUndefined();
    expect(n.fusionadoConId).toBeUndefined();
  });

  it('carries the owner-set credit line and term (ADR-074)', () => {
    const n = NewClientSchema.parse({
      nombre: 'Pedro',
      businessId: BIZ_ID,
      limiteCentavos: 500_00n,
      plazoDias: 15,
    });
    expect(n.limiteCentavos).toBe(500_00n);
    expect(n.plazoDias).toBe(15);
  });

  it('refuses a negative credit term', () => {
    expect(() =>
      NewClientSchema.parse({ nombre: 'Pedro', businessId: BIZ_ID, plazoDias: -1 }),
    ).toThrow();
  });

  it('a client created at the register arrives pendiente de revisión (ADR-074)', () => {
    const n = NewClientSchema.parse({
      nombre: 'Pedro',
      businessId: BIZ_ID,
      estadoRevision: 'pendiente',
    });
    expect(n.estadoRevision).toBe('pendiente');
  });

  it('records which client a merge fused into, or none', () => {
    const n = NewClientSchema.parse({
      nombre: 'Pedro',
      businessId: BIZ_ID,
      fusionadoConId: CLI_ID,
    });
    expect(n.fusionadoConId).toBe(CLI_ID);
    expect(() =>
      NewClientSchema.parse({ nombre: 'Pedro', businessId: BIZ_ID, fusionadoConId: 'no-ulid' }),
    ).toThrow();
  });
});

describe('ClientSchema · RFC (N-16)', () => {
  it('normalises a valid RFC to upper case', () => {
    const c = ClientSchema.parse({ ...validClient, rfc: 'eku9003173c9' });
    expect(c.rfc).toBe('EKU9003173C9');
  });

  it('keeps an absent RFC as unknown — every row the phone writes', () => {
    const c = ClientSchema.parse({ ...validClient, rfc: undefined });
    expect(c.rfc).toBeUndefined();
  });

  it('refuses an RFC that does not pass the fiscal check', () => {
    expect(() => ClientSchema.parse({ ...validClient, rfc: 'NOPE1' })).toThrow();
  });
});
