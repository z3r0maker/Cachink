import type { SincronizacionData } from '@/server/screens';

/**
 * How a refused record reads to the owner (CfgSincronizacion): what it was
 * («Un ajuste de inventario»), and what to do about it, next to the reason
 * (`motivoDeRechazo`). Never a table name or a code.
 */
export type Rechazo = SincronizacionData['rechazos'][number];

const QUE: Readonly<Record<string, string>> = {
  tickets: 'Una venta',
  sales: 'Una venta',
  expenses: 'Un gasto',
  caja_turnos: 'Un turno de caja',
  caja_movimientos: 'Un movimiento de caja',
  cancelacion_logs: 'Una cancelación',
  day_closes: 'Un corte del día',
  client_payments: 'Un abono de cliente',
  entregas_credito: 'Una venta a crédito',
  conversions: 'Una conversión de materia prima',
  auditorias_inventario: 'Un conteo de inventario',
  respuestas_operador: 'Una respuesta a un mensaje',
  products: 'Un producto',
  clients: 'Un cliente',
  inventory_movements: 'Un ajuste de inventario',
};

export const queEs = (r: Rechazo): string => QUE[r.tableName] ?? 'Un registro';

export type Clase = 'inventario' | 'venta' | 'otro';

export function claseDe(r: Rechazo): Clase {
  if (r.tableName === 'inventory_movements' || r.tableName === 'products') return 'inventario';
  return r.tableName === 'tickets' || r.tableName === 'sales' ? 'venta' : 'otro';
}

const CONSEJO: Readonly<Record<string, string>> = {
  VALIDATION: 'Si hacía falta, captúralo desde el portal.',
  BUSINESS_MISMATCH: 'Revisa en Equipo y nómina que esa caja sea de este negocio.',
  TABLE_NOT_WRITABLE: 'Si hacía falta, captúralo desde el portal.',
  HYBRID_UPDATE_FORBIDDEN: 'Si hacía falta, haz el cambio desde Productos.',
  FK_PRODUCT_MISSING: 'Revisa en Productos si se archivó.',
  FK_USER_MISSING: 'Revisa en Equipo y nómina si se dio de baja.',
  FK_CLIENT_MISSING: 'Revisa si se borró en el portal.',
  FK_MENSAJE_MISSING: 'Revisa si se borró en el portal.',
  DUPLICATE_CONFLICT: 'El primero ya quedó guardado; puedes marcar este como resuelto.',
};

export const consejo = (r: Rechazo): string =>
  CONSEJO[r.code] ?? 'Si hacía falta, captúralo desde el portal.';

/** The phone's own summary («Venta · Gringa ×1 · $60.00»), when it sent one. */
export const vistaPrevia = (r: Rechazo): string | null =>
  (r.payload as { preview?: string } | null)?.preview ?? null;

export const cajaDe = (r: Rechazo): string => r.dispositivo ?? 'una caja desvinculada';

export const tituloDe = (r: Rechazo): string => vistaPrevia(r) ?? `${queEs(r)} de ${cajaDe(r)}`;
