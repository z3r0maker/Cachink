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
});
