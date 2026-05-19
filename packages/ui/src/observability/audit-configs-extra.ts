/**
 * Additional audit configs — split from audit-configs.ts to stay under 200 lines.
 * Covers: productos (eliminar), clientes, empleados, usuarios, flags,
 * recurrentes, conversiones, auditorías, and business.
 */

import type { AuditedMutationConfig } from './use-audited-mutation';

export const MUTATION_ELIMINAR_PRODUCTO: AuditedMutationConfig<{ id: string; currentStock: number }, void> = {
  operation: 'producto.eliminar', entityType: 'product',
  extractEntityId: (_result, input) => input.id,
  extractMetadata: (input) => ({ currentStock: input.currentStock }),
};

export const MUTATION_CREAR_CLIENTE: AuditedMutationConfig<{ nombre: string }, { id: string }> = {
  operation: 'cliente.crear', entityType: 'client',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ nombre: input.nombre }),
};

export const MUTATION_EDITAR_CLIENTE: AuditedMutationConfig<{ id: string }, { id: string } | null> = {
  operation: 'cliente.editar', entityType: 'client',
  extractEntityId: (result, input) => result?.id ?? input.id,
  extractMetadata: (input) => ({ clientId: input.id }),
};

export const MUTATION_ELIMINAR_CLIENTE: AuditedMutationConfig<{ id: string }, void> = {
  operation: 'cliente.eliminar', entityType: 'client',
  extractEntityId: (_result, input) => input.id,
};

export const MUTATION_CREAR_EMPLEADO: AuditedMutationConfig<{ nombre: string }, { id: string }> = {
  operation: 'empleado.crear', entityType: 'employee',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ nombre: input.nombre }),
};

export const MUTATION_EDITAR_EMPLEADO: AuditedMutationConfig<{ id: string }, { id: string }> = {
  operation: 'empleado.editar', entityType: 'employee',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ employeeId: input.id }),
};

export const MUTATION_ELIMINAR_EMPLEADO: AuditedMutationConfig<string, void> = {
  operation: 'empleado.eliminar', entityType: 'employee',
  extractEntityId: (_result, input) => input,
};

export const MUTATION_CREAR_USUARIO: AuditedMutationConfig<{ nombre: string; role: string }, { id: string }> = {
  operation: 'usuario.crear', entityType: 'user',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ nombre: input.nombre, role: input.role }),
};

export const MUTATION_ELIMINAR_USUARIO: AuditedMutationConfig<string, void> = {
  operation: 'usuario.eliminar', entityType: 'user',
  extractEntityId: (_result, input) => input,
};

export const MUTATION_TOGGLE_FLAG: AuditedMutationConfig<{ key: string; newValue: boolean }, unknown> = {
  operation: 'flag.toggle', entityType: 'feature_flag',
  extractEntityId: (_result, input) => input.key,
  extractMetadata: (input) => ({ key: input.key, newValue: input.newValue }),
};

export const MUTATION_PROCESAR_RECURRENTE: AuditedMutationConfig<{ template: { id: string } }, { egreso?: { id: string } | null }> = {
  operation: 'recurrente.procesar', entityType: 'recurring_expense',
  extractEntityId: (_result, input) => input.template.id,
  extractMetadata: (_input, result) => ({ egresoCreated: !!result?.egreso, egresoId: result?.egreso?.id }),
};

export const MUTATION_DESCARTAR_RECURRENTE: AuditedMutationConfig<{ template: { id: string } }, unknown> = {
  operation: 'recurrente.descartar', entityType: 'recurring_expense',
  extractEntityId: (_result, input) => input.template.id,
};

export const MUTATION_CREAR_RECETA: AuditedMutationConfig<{ materiaPrimaId: string; productoResultanteId: string }, { id: string }> = {
  operation: 'conversion-receta.crear', entityType: 'conversion_receta',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ materiaPrimaId: input.materiaPrimaId, productoResultanteId: input.productoResultanteId }),
};

export const MUTATION_ELIMINAR_RECETA: AuditedMutationConfig<string, void> = {
  operation: 'conversion-receta.eliminar', entityType: 'conversion_receta',
  extractEntityId: (_result, input) => input,
};

export const MUTATION_CREAR_AUDITORIA: AuditedMutationConfig<void, { id: string; totalProductos: number }> = {
  operation: 'auditoria.crear', entityType: 'auditoria_inventario',
  extractEntityId: (result) => result.id,
  extractMetadata: (_input, result) => ({ totalProductos: result?.totalProductos }),
};

export const MUTATION_ACTUALIZAR_AUDITORIA: AuditedMutationConfig<{ id: string; estado: string; lineas: readonly unknown[] }, { id: string }> = {
  operation: 'auditoria.actualizar', entityType: 'auditoria_inventario',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ auditoriaId: input.id, estado: input.estado }),
};

export const MUTATION_CREAR_BUSINESS: AuditedMutationConfig<{ nombre: string }, { id: string }> = {
  operation: 'business.crear', entityType: 'business',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ nombre: input.nombre }),
};
