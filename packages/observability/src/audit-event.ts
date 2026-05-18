/**
 * AuditEvent — immutable record of a money-movement or business operation.
 *
 * Every use-case instrumented with `AuditedUseCase` produces one of these
 * on success or failure. The event is persisted to `__cachink_observability_log`
 * by the active `LogStore` implementation.
 *
 * All monetary values in metadata are integer centavos (CLAUDE.md §2.8).
 */

export type AuditOperation =
  // ── Ventas ──
  | 'venta.registrar'
  | 'venta.editar'
  | 'venta.cancelar'
  | 'venta.eliminar'
  // ── Egresos ──
  | 'egreso.registrar'
  | 'egreso.editar'
  | 'egreso.eliminar'
  // ── Caja ──
  | 'caja.abrir'
  | 'caja.cerrar'
  | 'caja.depositar'
  | 'caja.retirar'
  // ── Pagos ──
  | 'pago.registrar'
  // ── Inventario ──
  | 'inventario.movimiento'
  | 'inventario.conversion'
  // ── Corte ──
  | 'corte.cerrar'
  // ── Productos ──
  | 'producto.crear'
  | 'producto.editar'
  | 'producto.eliminar'
  // ── Clientes ──
  | 'cliente.crear'
  | 'cliente.editar'
  | 'cliente.eliminar'
  // ── Empleados ──
  | 'empleado.crear'
  | 'empleado.editar'
  | 'empleado.eliminar'
  // ── Usuarios ──
  | 'usuario.crear'
  | 'usuario.eliminar'
  // ── Feature Flags ──
  | 'flag.toggle'
  // ── Recurrentes ──
  | 'recurrente.procesar'
  | 'recurrente.descartar'
  // ── Conversión Recetas ──
  | 'conversion-receta.crear'
  | 'conversion-receta.eliminar'
  // ── Auditoría de Inventario ──
  | 'auditoria.crear'
  | 'auditoria.actualizar'
  // ── Business ──
  | 'business.crear'
  // ── Sync ──
  | 'sync.lan.pair'
  | 'sync.lan.disconnect'
  | 'sync.cloud.connect'
  | 'sync.cloud.disconnect'
  | 'sync.conflict'
  // ── Lifecycle ──
  | 'system.cold-start'
  | 'system.foreground'
  | 'system.background'
  | 'system.migration'
  | 'system.auto-lock'
  // ── Auth ──
  | 'auth.login'
  | 'auth.logout'
  | 'auth.role-switch'
  // ── Network ──
  | 'network.online'
  | 'network.offline'
  // ── Navigation (dev-only) ──
  | 'nav.screen-view';

export interface AuditEvent {
  readonly id: string;
  readonly timestamp: string;
  readonly operation: AuditOperation;
  readonly entityType: string;
  readonly entityId: string;
  readonly userId: string | null;
  readonly deviceId: string;
  readonly businessId: string;
  readonly metadata?: Record<string, unknown>;
  readonly status: 'success' | 'error';
  readonly errorCode?: string;
  readonly errorMessage?: string;
  /** Execution time in milliseconds (Phase 4 — performance telemetry). */
  readonly durationMs?: number;
}
