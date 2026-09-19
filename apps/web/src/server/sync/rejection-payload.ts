import 'server-only';

import type { PushableTable } from '@xangarro/contracts';
import { encodeJson } from '@xangarro/contracts';

import type { Row } from './codec';

/**
 * What a rejection keeps: a line the shopkeeper can recognise on
 * Sincronización (`preview`), and the row itself for whoever fixes it.
 */
const NOUN: Record<PushableTable, string> = {
  tickets: 'Venta',
  sales: 'Venta',
  expenses: 'Gasto',
  inventory_movements: 'Movimiento de inventario',
  caja_turnos: 'Turno de caja',
  caja_movimientos: 'Movimiento de caja',
  cancelacion_logs: 'Cancelación',
  day_closes: 'Corte del día',
  client_payments: 'Abono',
  entregas_credito: 'Entrega a crédito',
  conversions: 'Conversión',
  auditorias_inventario: 'Auditoría de inventario',
  respuestas_operador: 'Respuesta a Pedro',
  products: 'Producto',
  clients: 'Cliente',
};

export function rejectionPayload(table: PushableTable, row: Row): string {
  const what = row['concepto'] ?? row['nombre'] ?? row['texto'] ?? row['id'];
  return encodeJson({ preview: `${NOUN[table]} · ${String(what)}`, row });
}
