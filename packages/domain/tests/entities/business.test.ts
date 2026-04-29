import { describe, it, expect } from 'vitest';
import {
  BusinessSchema,
  NewBusinessSchema,
  TipoNegocioEnum,
  AttrDefSchema,
} from '../../src/entities/index.js';

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

  // --- UXD-R3 new fields ---

  it('defaults tipoNegocio to mixto when omitted', () => {
    const parsed = BusinessSchema.parse(validBusiness);
    expect(parsed.tipoNegocio).toBe('mixto');
  });

  it('defaults categoriaVentaPredeterminada to Producto when omitted', () => {
    const parsed = BusinessSchema.parse(validBusiness);
    expect(parsed.categoriaVentaPredeterminada).toBe('Producto');
  });

  it('defaults atributosProducto to [] when omitted', () => {
    const parsed = BusinessSchema.parse(validBusiness);
    expect(parsed.atributosProducto).toEqual([]);
  });

  it('accepts explicit tipoNegocio values', () => {
    for (const t of TipoNegocioEnum.options) {
      const parsed = BusinessSchema.parse({ ...validBusiness, tipoNegocio: t });
      expect(parsed.tipoNegocio).toBe(t);
    }
  });

  it('rejects an unknown tipoNegocio', () => {
    expect(() =>
      BusinessSchema.parse({ ...validBusiness, tipoNegocio: 'franquicia' }),
    ).toThrow();
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

describe('TipoNegocioEnum', () => {
  it('enumerates the four business archetypes', () => {
    expect(TipoNegocioEnum.options).toEqual([
      'producto-con-stock',
      'producto-sin-stock',
      'servicio',
      'mixto',
    ]);
  });
});

describe('AttrDefSchema', () => {
  it('accepts a valid texto attribute', () => {
    const parsed = AttrDefSchema.parse({
      clave: 'color',
      label: 'Color',
      tipo: 'texto',
    });
    expect(parsed.clave).toBe('color');
    expect(parsed.obligatorio).toBe(false);
  });

  it('accepts a valid select attribute with opciones', () => {
    const parsed = AttrDefSchema.parse({
      clave: 'talla',
      label: 'Talla',
      tipo: 'select',
      opciones: ['S', 'M', 'L', 'XL'],
      obligatorio: true,
    });
    expect(parsed.opciones).toEqual(['S', 'M', 'L', 'XL']);
    expect(parsed.obligatorio).toBe(true);
  });

  it('rejects a clave starting with a number', () => {
    expect(() =>
      AttrDefSchema.parse({ clave: '1color', label: 'Color', tipo: 'texto' }),
    ).toThrow();
  });

  it('rejects a clave with uppercase letters', () => {
    expect(() =>
      AttrDefSchema.parse({ clave: 'Color', label: 'Color', tipo: 'texto' }),
    ).toThrow();
  });

  it('rejects an empty clave', () => {
    expect(() =>
      AttrDefSchema.parse({ clave: '', label: 'Color', tipo: 'texto' }),
    ).toThrow();
  });
});
