/**
 * Centralized audit configuration for all instrumented use cases and mutations.
 *
 * Each config defines: operation name, entity type, how to extract the
 * entity ID from the result, and optional metadata extraction.
 *
 * AuditedUseCaseConfig  — for use cases wrapped via AuditedUseCase.
 * AuditedMutationConfig — for mutation hooks wrapped via useAuditedMutation.
 */

import type { AuditedUseCaseConfig } from '@cachink/observability';
import type { Sale, Expense, CajaTurno, CajaMovimiento, ClientPayment } from '@cachink/domain';
import type { NewSale, NewExpense } from '@cachink/domain';
import type { AuditedMutationConfig } from './use-audited-mutation';

// ─── Ventas ─────────────────────────────────────────────────────────

export const AUDIT_REGISTRAR_VENTA: AuditedUseCaseConfig<NewSale, Sale> = {
  operation: 'venta.registrar',
  entityType: 'sale',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({
    montoCentavos: input.montoCentavos,
    metodo: input.metodo,
    categoria: input.categoria,
    productoId: input.productoId,
  }),
};

export const AUDIT_EDITAR_VENTA: AuditedUseCaseConfig<{ id: string }, Sale> = {
  operation: 'venta.editar',
  entityType: 'sale',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ saleId: input.id }),
};

export const AUDIT_CANCELAR_VENTA: AuditedUseCaseConfig<{ saleId: string }, void> = {
  operation: 'venta.cancelar',
  entityType: 'sale',
  extractEntityId: (_result, input) => input.saleId,
  extractMetadata: (input) => ({ saleId: input.saleId }),
};

// ─── Egresos ────────────────────────────────────────────────────────

export const AUDIT_REGISTRAR_EGRESO: AuditedUseCaseConfig<NewExpense, Expense> = {
  operation: 'egreso.registrar',
  entityType: 'expense',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({
    montoCentavos: input.montoCentavos,
    tipo: input.tipo,
    categoria: input.categoria,
  }),
};

export const AUDIT_EDITAR_EGRESO: AuditedUseCaseConfig<{ id: string }, Expense> = {
  operation: 'egreso.editar',
  entityType: 'expense',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ expenseId: input.id }),
};

// ─── Caja ───────────────────────────────────────────────────────────

export const AUDIT_ABRIR_CAJA: AuditedUseCaseConfig<{ montoAperturaCentavos: number }, CajaTurno> = {
  operation: 'caja.abrir',
  entityType: 'caja_turno',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ montoAperturaCentavos: input.montoAperturaCentavos }),
};

export const AUDIT_CERRAR_CAJA: AuditedUseCaseConfig<{ turnoId: string }, CajaTurno> = {
  operation: 'caja.cerrar',
  entityType: 'caja_turno',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ turnoId: input.turnoId }),
};

export const AUDIT_DEPOSITAR_CAJA: AuditedUseCaseConfig<
  { montoCentavos: number },
  CajaMovimiento
> = {
  operation: 'caja.depositar',
  entityType: 'caja_movimiento',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ montoCentavos: input.montoCentavos }),
};

export const AUDIT_RETIRAR_CAJA: AuditedUseCaseConfig<
  { montoCentavos: number },
  CajaMovimiento
> = {
  operation: 'caja.retirar',
  entityType: 'caja_movimiento',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ montoCentavos: input.montoCentavos }),
};

// ─── Pagos ──────────────────────────────────────────────────────────

export const AUDIT_REGISTRAR_PAGO: AuditedUseCaseConfig<
  { montoCentavos: number },
  ClientPayment
> = {
  operation: 'pago.registrar',
  entityType: 'client_payment',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ montoCentavos: input.montoCentavos }),
};

// ─── Inventario ─────────────────────────────────────────────────────

export const AUDIT_MOVIMIENTO_INVENTARIO: AuditedUseCaseConfig<
  { productoId: string; tipo: string; cantidad: number },
  { id: string }
> = {
  operation: 'inventario.movimiento',
  entityType: 'inventory_movement',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({
    productoId: input.productoId,
    tipo: input.tipo,
    cantidad: input.cantidad,
  }),
};

export const AUDIT_EJECUTAR_CONVERSION: AuditedUseCaseConfig<
  { recetaId: string; cantidad: number },
  { id: string }
> = {
  operation: 'inventario.conversion',
  entityType: 'conversion',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ recetaId: input.recetaId, cantidad: input.cantidad }),
};

// ─── Corte de Día ──────────────────────────────────────────────────���

export const AUDIT_CERRAR_CORTE: AuditedUseCaseConfig<
  { efectivoContadoCentavos: number },
  { id: string }
> = {
  operation: 'corte.cerrar',
  entityType: 'day_close',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ efectivoContadoCentavos: input.efectivoContadoCentavos }),
};

// ═══════════════════════════════════════════════════════════════════
// Mutation audit configs (Phase 1 — useAuditedMutation wrappers)
// ═══════════════════════════════════════════════════════════════════

// ─── Eliminar Venta ────────────────────────────────────────────────

export const MUTATION_ELIMINAR_VENTA: AuditedMutationConfig<
  { id: string; fecha: string },
  void
> = {
  operation: 'venta.eliminar',
  entityType: 'sale',
  extractEntityId: (_result, input) => input.id,
  extractMetadata: (input) => ({ fecha: input.fecha }),
};

// ─── Eliminar Egreso ───────────────────────────────────────────────

export const MUTATION_ELIMINAR_EGRESO: AuditedMutationConfig<
  { id: string; fecha: string },
  void
> = {
  operation: 'egreso.eliminar',
  entityType: 'expense',
  extractEntityId: (_result, input) => input.id,
  extractMetadata: (input) => ({ fecha: input.fecha }),
};

// ─── Crear Producto ────────────────────────────────────────────────

export const MUTATION_CREAR_PRODUCTO: AuditedMutationConfig<
  { nombre: string; costoUnit: unknown; precioVenta: unknown },
  { id: string }
> = {
  operation: 'producto.crear',
  entityType: 'product',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ nombre: input.nombre }),
};

// ─── Editar Producto ───────────────────────────────────────────────

export const MUTATION_EDITAR_PRODUCTO: AuditedMutationConfig<
  { id: string },
  { id: string }
> = {
  operation: 'producto.editar',
  entityType: 'product',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ productId: input.id }),
};

// ─── Eliminar Producto ─────────────────────────────────────────────

export const MUTATION_ELIMINAR_PRODUCTO: AuditedMutationConfig<
  { id: string; currentStock: number },
  void
> = {
  operation: 'producto.eliminar',
  entityType: 'product',
  extractEntityId: (_result, input) => input.id,
  extractMetadata: (input) => ({ currentStock: input.currentStock }),
};

// ─── Crear Cliente ─────────────────────────────────────────────────

export const MUTATION_CREAR_CLIENTE: AuditedMutationConfig<
  { nombre: string },
  { id: string }
> = {
  operation: 'cliente.crear',
  entityType: 'client',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ nombre: input.nombre }),
};

// ─── Editar Cliente ────────────────────────────────────────────────

export const MUTATION_EDITAR_CLIENTE: AuditedMutationConfig<
  { id: string },
  { id: string } | null
> = {
  operation: 'cliente.editar',
  entityType: 'client',
  extractEntityId: (result, input) => result?.id ?? input.id,
  extractMetadata: (input) => ({ clientId: input.id }),
};

// ─── Eliminar Cliente ──────────────────────────────────────────────

export const MUTATION_ELIMINAR_CLIENTE: AuditedMutationConfig<
  { id: string },
  void
> = {
  operation: 'cliente.eliminar',
  entityType: 'client',
  extractEntityId: (_result, input) => input.id,
};

// ─── Crear Empleado ────────────────────────────────────────────────

export const MUTATION_CREAR_EMPLEADO: AuditedMutationConfig<
  { nombre: string },
  { id: string }
> = {
  operation: 'empleado.crear',
  entityType: 'employee',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ nombre: input.nombre }),
};

// ─── Editar Empleado ───────────────────────────────────────────────

export const MUTATION_EDITAR_EMPLEADO: AuditedMutationConfig<
  { id: string },
  { id: string }
> = {
  operation: 'empleado.editar',
  entityType: 'employee',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ employeeId: input.id }),
};

// ─── Eliminar Empleado ─────────────────────────────────────────────

export const MUTATION_ELIMINAR_EMPLEADO: AuditedMutationConfig<
  string,
  void
> = {
  operation: 'empleado.eliminar',
  entityType: 'employee',
  extractEntityId: (_result, input) => input,
};

// ─── Crear Usuario ─────────────────────────────────────────────────

export const MUTATION_CREAR_USUARIO: AuditedMutationConfig<
  { nombre: string; role: string },
  { id: string }
> = {
  operation: 'usuario.crear',
  entityType: 'user',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ nombre: input.nombre, role: input.role }),
};

// ─── Eliminar Usuario ──────────────────────────────────────────────

export const MUTATION_ELIMINAR_USUARIO: AuditedMutationConfig<
  string,
  void
> = {
  operation: 'usuario.eliminar',
  entityType: 'user',
  extractEntityId: (_result, input) => input,
};

// ─── Toggle Feature Flag ──────────────────────────────────────────

export const MUTATION_TOGGLE_FLAG: AuditedMutationConfig<
  { key: string; newValue: boolean },
  unknown
> = {
  operation: 'flag.toggle',
  entityType: 'feature_flag',
  extractEntityId: (_result, input) => input.key,
  extractMetadata: (input) => ({ key: input.key, newValue: input.newValue }),
};

// ─── Procesar Gasto Recurrente ─────────────────────────────────────

export const MUTATION_PROCESAR_RECURRENTE: AuditedMutationConfig<
  { template: { id: string } },
  { egreso?: { id: string } | null }
> = {
  operation: 'recurrente.procesar',
  entityType: 'recurring_expense',
  extractEntityId: (_result, input) => input.template.id,
  extractMetadata: (_input, result) => ({
    egresoCreated: !!result?.egreso,
    egresoId: result?.egreso?.id,
  }),
};

// ─── Descartar Gasto Recurrente ────────────────────────────────────

export const MUTATION_DESCARTAR_RECURRENTE: AuditedMutationConfig<
  { template: { id: string } },
  unknown
> = {
  operation: 'recurrente.descartar',
  entityType: 'recurring_expense',
  extractEntityId: (_result, input) => input.template.id,
};

// ─── Crear Conversión Receta ───────────────────────────────────────

export const MUTATION_CREAR_RECETA: AuditedMutationConfig<
  { materiaPrimaId: string; productoResultanteId: string },
  { id: string }
> = {
  operation: 'conversion-receta.crear',
  entityType: 'conversion_receta',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({
    materiaPrimaId: input.materiaPrimaId,
    productoResultanteId: input.productoResultanteId,
  }),
};

// ─── Eliminar Conversión Receta ────────────────────────────────────

export const MUTATION_ELIMINAR_RECETA: AuditedMutationConfig<
  string,
  void
> = {
  operation: 'conversion-receta.eliminar',
  entityType: 'conversion_receta',
  extractEntityId: (_result, input) => input,
};

// ─── Crear Auditoría ───────────────────────────────────────────────

export const MUTATION_CREAR_AUDITORIA: AuditedMutationConfig<
  void,
  { id: string; totalProductos: number }
> = {
  operation: 'auditoria.crear',
  entityType: 'auditoria_inventario',
  extractEntityId: (result) => result.id,
  extractMetadata: (_input, result) => ({ totalProductos: result?.totalProductos }),
};

// ─── Actualizar Auditoría ──────────────────────────────────────────

export const MUTATION_ACTUALIZAR_AUDITORIA: AuditedMutationConfig<
  { id: string; estado: string; lineas: readonly unknown[] },
  { id: string }
> = {
  operation: 'auditoria.actualizar',
  entityType: 'auditoria_inventario',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ auditoriaId: input.id, estado: input.estado }),
};

// ─── Crear Business ────────────────────────────────────────────────

export const MUTATION_CREAR_BUSINESS: AuditedMutationConfig<
  { nombre: string },
  { id: string }
> = {
  operation: 'business.crear',
  entityType: 'business',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ nombre: input.nombre }),
};
