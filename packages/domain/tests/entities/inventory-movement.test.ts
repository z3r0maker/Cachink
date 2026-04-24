import { describe, it, expect } from 'vitest';
import {
  InventoryMovementSchema,
  NewInventoryMovementSchema,
  EntryReasonEnum,
  ExitReasonEnum,
  MovementTypeEnum,
} from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const MOV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TF0';
const PROD_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEZ';

const validEntrada = {
  id: MOV_ID,
  productoId: PROD_ID,
  fecha: '2026-04-23',
  tipo: 'entrada' as const,
  cantidad: 10,
  costoUnitCentavos: 3500n,
  motivo: 'Compra a proveedor',
  nota: null,
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdAt: '2026-04-23T15:00:00.000Z',
  updatedAt: '2026-04-23T15:00:00.000Z',
  deletedAt: null,
};

const validSalida = {
  ...validEntrada,
  tipo: 'salida' as const,
  motivo: 'Venta',
};

describe('InventoryMovementSchema', () => {
  it('accepts a well-formed entrada with valid motivo', () => {
    expect(() => InventoryMovementSchema.parse(validEntrada)).not.toThrow();
  });

  it('accepts a well-formed salida with valid motivo', () => {
    expect(() => InventoryMovementSchema.parse(validSalida)).not.toThrow();
  });

  it('rejects a cantidad of 0', () => {
    expect(() => InventoryMovementSchema.parse({ ...validEntrada, cantidad: 0 })).toThrow();
  });

  it('rejects a float cantidad', () => {
    expect(() => InventoryMovementSchema.parse({ ...validEntrada, cantidad: 2.5 })).toThrow();
  });

  it('rejects an entrada with a salida-only motivo', () => {
    expect(() => InventoryMovementSchema.parse({ ...validEntrada, motivo: 'Venta' })).toThrow(
      /motivo must match/,
    );
  });

  it('rejects a salida with an entrada-only motivo', () => {
    expect(() =>
      InventoryMovementSchema.parse({
        ...validSalida,
        motivo: 'Compra a proveedor',
      }),
    ).toThrow(/motivo must match/);
  });

  it('rejects a motivo that matches neither side', () => {
    expect(() => InventoryMovementSchema.parse({ ...validEntrada, motivo: 'Otra cosa' })).toThrow();
  });

  it('accepts an "Ajuste de inventario" motivo for both tipos', () => {
    expect(() =>
      InventoryMovementSchema.parse({
        ...validEntrada,
        motivo: 'Ajuste de inventario',
      }),
    ).not.toThrow();
    expect(() =>
      InventoryMovementSchema.parse({
        ...validSalida,
        motivo: 'Ajuste de inventario',
      }),
    ).not.toThrow();
  });
});

describe('NewInventoryMovementSchema', () => {
  it('accepts a minimal input without nota', () => {
    expect(() =>
      NewInventoryMovementSchema.parse({
        productoId: PROD_ID,
        fecha: '2026-04-23',
        tipo: 'entrada',
        cantidad: 5,
        costoUnitCentavos: 3500n,
        motivo: 'Producción',
        businessId: BIZ_ID,
      }),
    ).not.toThrow();
  });
});

describe('Movement enums', () => {
  it('MovementTypeEnum enumerates entrada / salida', () => {
    expect(MovementTypeEnum.options).toEqual(['entrada', 'salida']);
  });

  it('EntryReasonEnum enumerates the five MOV_MOTIVO_ENT values', () => {
    expect(EntryReasonEnum.options).toEqual([
      'Compra a proveedor',
      'Devolución de cliente',
      'Ajuste de inventario',
      'Producción',
      'Otro',
    ]);
  });

  it('ExitReasonEnum enumerates the six MOV_MOTIVO_SAL values', () => {
    expect(ExitReasonEnum.options).toEqual([
      'Venta',
      'Uso en producción',
      'Merma / daño',
      'Muestra',
      'Ajuste de inventario',
      'Otro',
    ]);
  });
});
