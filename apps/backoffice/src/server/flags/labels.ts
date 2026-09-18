import type { PlatformFlagKey, PlatformFlagMode } from '@xangarro/domain';

/** Spanish copy for the flag page — one place, shared by table, editor and history. */
export interface FlagCopy {
  readonly nombre: string;
  readonly descripcion: string;
  readonly tipo: 'Función' | 'Kill switch';
}

export const FLAG_COPY: Record<PlatformFlagKey, FlagCopy> = {
  stock: { nombre: 'Stock', descripcion: 'Existencias y movimientos.', tipo: 'Función' },
  barcode: { nombre: 'Código de barras', descripcion: 'Escáner en caja.', tipo: 'Función' },
  conversionMateriaPrima: {
    nombre: 'Conversión de materia prima',
    descripcion: 'Recetas que transforman insumos.',
    tipo: 'Función',
  },
  conversionAutomatica: {
    nombre: 'Conversión automática',
    descripcion: 'La receta se aplica al vender.',
    tipo: 'Función',
  },
  auditoriaInventario: {
    nombre: 'Auditoría de inventario',
    descripcion: 'Conteos físicos contra el sistema.',
    tipo: 'Función',
  },
  merma: { nombre: 'Merma', descripcion: 'Registro de pérdidas.', tipo: 'Función' },
  ventasCredito: {
    nombre: 'Ventas a crédito',
    descripcion: 'Cuentas por cobrar.',
    tipo: 'Función',
  },
  asesorLlm: {
    nombre: 'Asesor con IA',
    descripcion: 'Llamadas al modelo; apagado muestra «Próximamente» (ADR-059).',
    tipo: 'Kill switch',
  },
  comprobanteShare: {
    nombre: 'Compartir comprobante',
    descripcion: 'Enviar el comprobante de una venta.',
    tipo: 'Kill switch',
  },
  cobrosIntegrados: {
    nombre: 'Cobros integrados',
    descripcion: 'Cobro con tarjeta (cuando exista).',
    tipo: 'Kill switch',
  },
};

export const MODE_LABELS: Record<PlatformFlagMode, string> = {
  off: 'Apagado',
  on: 'Encendido',
  allowlist: 'Lista beta',
};

/** The `staff_audit_log` action every change writes (`area.verbo`). */
export const FLAG_AUDIT_ACTION = 'flags.cambiar';

/** What the confirmation button posts when a change switches a key off for everyone. */
export const CONFIRM_OFF = 'apagar';
