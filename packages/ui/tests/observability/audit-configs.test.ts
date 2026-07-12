/**
 * Audit config smoke tests — verify all exported configs have valid shape.
 *
 * These configs are used by AuditedUseCase and useAuditedMutation to stamp
 * audit events. Testing their extract* functions ensures they won't crash
 * at runtime.
 */

import { describe, it, expect } from 'vitest';
import {
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
    const id = AUDIT_REGISTRAR_VENTA.extractEntityId(
      { id: 'sale-123' } as never,
      {} as never,
    );
    expect(id).toBe('sale-123');
  });

  it('AUDIT_REGISTRAR_VENTA extracts metadata from input', () => {
    const meta = AUDIT_REGISTRAR_VENTA.extractMetadata?.(
      { monto: 5000n, metodo: 'Efectivo', categoria: 'Producto', productoId: 'p1' } as never,
    );
    expect(meta).toEqual({
      monto: '5000',
      metodo: 'Efectivo',
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
    const meta = AUDIT_ABRIR_CAJA.extractMetadata?.(
      { montoAperturaCentavos: 5000n } as never,
    );
    expect(meta).toEqual({ montoAperturaCentavos: '5000' });
  });
});
