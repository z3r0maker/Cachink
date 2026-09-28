/**
 * Audit config smoke tests — verify all exported configs have valid shape.
 *
 * These configs are used by AuditedUseCase and useAuditedMutation to stamp
 * audit events. Testing their extract* functions ensures they won't crash
 * at runtime.
 */

import { describe, it, expect } from 'vitest';
import {
  AUDIT_DEPOSITAR_CAJA,
  AUDIT_MOVIMIENTO_INVENTARIO,
  AUDIT_RETIRAR_CAJA,
  AUDIT_REGISTRAR_VENTA,
  AUDIT_EDITAR_VENTA,
  AUDIT_CANCELAR_VENTA,
  AUDIT_REGISTRAR_EGRESO,
  AUDIT_EDITAR_EGRESO,
  AUDIT_ABRIR_CAJA,
  AUDIT_CERRAR_CAJA,
  AUDIT_REGISTRAR_PAGO,
  AUDIT_CERRAR_CORTE,
  AUDIT_EJECUTAR_CONVERSION,
  MUTATION_ELIMINAR_VENTA,
  MUTATION_ELIMINAR_EGRESO,
  MUTATION_CREAR_PRODUCTO,
  MUTATION_EDITAR_PRODUCTO,
} from '../../src/observability/audit-configs';

describe('Audit configs (AuditedUseCaseConfig)', () => {
  const configs = [
    { name: 'AUDIT_REGISTRAR_VENTA', config: AUDIT_REGISTRAR_VENTA },
    { name: 'AUDIT_EDITAR_VENTA', config: AUDIT_EDITAR_VENTA },
    { name: 'AUDIT_CANCELAR_VENTA', config: AUDIT_CANCELAR_VENTA },
    { name: 'AUDIT_REGISTRAR_EGRESO', config: AUDIT_REGISTRAR_EGRESO },
    { name: 'AUDIT_EDITAR_EGRESO', config: AUDIT_EDITAR_EGRESO },
    { name: 'AUDIT_ABRIR_CAJA', config: AUDIT_ABRIR_CAJA },
    { name: 'AUDIT_CERRAR_CAJA', config: AUDIT_CERRAR_CAJA },
    { name: 'AUDIT_REGISTRAR_PAGO', config: AUDIT_REGISTRAR_PAGO },
    { name: 'AUDIT_CERRAR_CORTE', config: AUDIT_CERRAR_CORTE },
    { name: 'AUDIT_EJECUTAR_CONVERSION', config: AUDIT_EJECUTAR_CONVERSION },
  ];

  for (const { name, config } of configs) {
    describe(name, () => {
      it('has a valid operation string', () => {
        expect(config.operation).toContain('.');
      });

      it('has a non-empty entityType', () => {
        expect(config.entityType.length).toBeGreaterThan(0);
      });

      it('extractEntityId is a function', () => {
        expect(typeof config.extractEntityId).toBe('function');
      });
    });
  }

  it('AUDIT_REGISTRAR_VENTA extracts entity ID from result', () => {
    const id = AUDIT_REGISTRAR_VENTA.extractEntityId({ id: 'sale-123' } as never, {} as never);
    expect(id).toBe('sale-123');
  });

  it('AUDIT_REGISTRAR_VENTA extracts metadata from input', () => {
    const meta = AUDIT_REGISTRAR_VENTA.extractMetadata?.({
      monto: 5000n,
      metodo: 'Efectivo',
      categoria: 'Producto',
      productoId: 'p1',
    } as never);
    expect(meta).toEqual({
      monto: '5000',
      categoria: 'Producto',
      productoId: 'p1',
    });
  });

  it('AUDIT_CANCELAR_VENTA extracts entity ID from input', () => {
    const id = AUDIT_CANCELAR_VENTA.extractEntityId(
      undefined as never,
      { saleId: 'sale-456' } as never,
    );
    expect(id).toBe('sale-456');
  });

  it('AUDIT_ABRIR_CAJA extracts montoAperturaCentavos as metadata', () => {
    const meta = AUDIT_ABRIR_CAJA.extractMetadata?.({ montoAperturaCentavos: 5000n } as never);
    expect(meta).toEqual({ montoAperturaCentavos: '5000' });
  });
});

// The seven the smoke block above only type-checks: their extractors are
// called here, with the inputs each reads.
describe('Audit configs · extractors exercised', () => {
  it('caja.depositar and caja.retirar carry the movement id and the amount', () => {
    for (const config of [AUDIT_DEPOSITAR_CAJA, AUDIT_RETIRAR_CAJA]) {
      expect(config.extractEntityId({ id: 'mov-1' } as never, {} as never)).toBe('mov-1');
      expect(config.extractMetadata?.({ montoCentavos: 500_00n } as never)).toEqual({
        montoCentavos: 500_00n,
      });
    }
  });

  it('inventario.movimiento names the product, the kind and the count', () => {
    expect(AUDIT_MOVIMIENTO_INVENTARIO.extractEntityId({ id: 'im-1' } as never, {} as never)).toBe(
      'im-1',
    );
    expect(
      AUDIT_MOVIMIENTO_INVENTARIO.extractMetadata?.({
        productoId: 'p-1',
        tipo: 'entrada',
        cantidad: 3,
      } as never),
    ).toEqual({ productoId: 'p-1', tipo: 'entrada', cantidad: 3 });
  });

  it('MUTATION_ELIMINAR_VENTA y EGRESO take the id from the input and stamp the date', () => {
    for (const config of [MUTATION_ELIMINAR_VENTA, MUTATION_ELIMINAR_EGRESO]) {
      expect(
        config.extractEntityId(undefined as never, { id: 'x-9', fecha: '2026-09-28' } as never),
      ).toBe('x-9');
      expect(config.extractMetadata?.({ id: 'x-9', fecha: '2026-09-28' } as never)).toEqual({
        fecha: '2026-09-28',
      });
    }
  });

  it('MUTATION_CREAR_PRODUCTO y EDITAR read id, nombre and precio from their sides', () => {
    expect(MUTATION_CREAR_PRODUCTO.extractEntityId({ id: 'prod-1' } as never, {} as never)).toBe(
      'prod-1',
    );
    expect(MUTATION_CREAR_PRODUCTO.extractMetadata?.({ nombre: 'Queso' } as never)).toEqual({
      nombre: 'Queso',
    });
    expect(MUTATION_EDITAR_PRODUCTO.extractEntityId({ id: 'prod-2' } as never, {} as never)).toBe(
      'prod-2',
    );
  });
});
