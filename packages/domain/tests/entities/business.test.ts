import { describe, it, expect } from 'vitest';
import { BusinessSchema, NewBusinessSchema } from '../../src/entities/index.js';

const validBusiness = {
  id: '01HZ8XQN9GZJXV8AKQ5X0C7TEM',
  nombre: 'Tortillería La Esperanza',
  regimenFiscal: 'RIF',
  isrTasa: 0.3,
  logoUrl: null,
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7TEN',
  deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7TEP',
  createdAt: '2026-04-23T12:00:00.000Z',
  updatedAt: '2026-04-23T12:00:00.000Z',
  deletedAt: null,
};

describe('BusinessSchema', () => {
  it('accepts a well-formed Business with all fields', () => {
    expect(() => BusinessSchema.parse(validBusiness)).not.toThrow();
  });

  it('accepts an https logoUrl', () => {
    const parsed = BusinessSchema.parse({
      ...validBusiness,
      logoUrl: 'https://example.com/logo.png',
    });
    expect(parsed.logoUrl).toBe('https://example.com/logo.png');
  });

  it('rejects a missing nombre field', () => {
    const { nombre: _nombre, ...rest } = validBusiness;
    expect(() => BusinessSchema.parse(rest)).toThrow();
  });

  it('rejects an empty nombre', () => {
    expect(() => BusinessSchema.parse({ ...validBusiness, nombre: '' })).toThrow();
  });

  it('rejects isrTasa above 1', () => {
    expect(() => BusinessSchema.parse({ ...validBusiness, isrTasa: 1.5 })).toThrow();
  });

  it('rejects isrTasa below 0', () => {
    expect(() => BusinessSchema.parse({ ...validBusiness, isrTasa: -0.1 })).toThrow();
  });

  it('rejects a malformed ULID for id', () => {
    expect(() => BusinessSchema.parse({ ...validBusiness, id: 'not-a-ulid' })).toThrow();
  });

  it('rejects an invalid ISO timestamp for createdAt', () => {
    expect(() =>
      BusinessSchema.parse({ ...validBusiness, createdAt: '2026-04-23 12:00:00' }),
    ).toThrow();
  });

  it('rejects a malformed logoUrl', () => {
    expect(() => BusinessSchema.parse({ ...validBusiness, logoUrl: 'not a url' })).toThrow();
  });
});

describe('NewBusinessSchema', () => {
  it('accepts an input payload without id or audit fields', () => {
    const parsed = NewBusinessSchema.parse({
      nombre: 'Taquería El Buen Sabor',
      regimenFiscal: 'PF actividad empresarial',
      isrTasa: 0.3,
      logoUrl: null,
      businessId: '01HZ8XQN9GZJXV8AKQ5X0C7TEN',
      deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7TEP',
    });
    expect(parsed.nombre).toBe('Taquería El Buen Sabor');
  });

  it('rejects missing regimenFiscal', () => {
    expect(() =>
      NewBusinessSchema.parse({
        nombre: 'Taquería',
        isrTasa: 0.3,
        logoUrl: null,
        businessId: '01HZ8XQN9GZJXV8AKQ5X0C7TEN',
        deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7TEP',
      }),
    ).toThrow();
  });
});
