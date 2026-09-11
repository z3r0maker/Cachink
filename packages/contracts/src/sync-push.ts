/**
 * `POST /sync/push` (docs/plan/02-contracts.md §4). One delta per row; the
 * row schema is the domain entity schema for that table, in wire form.
 */

import { z } from 'zod';
import {
  AuditoriaInventarioSchema,
  CajaMovimientoSchema,
  CajaTurnoSchema,
  CancelacionLogSchema,
  ClientPaymentSchema,
  ClientSchema,
  ConversionSchema,
  DayCloseSchema,
  EntregaCreditoSchema,
  ExpenseSchema,
  InventoryMovementSchema,
  ProductSchema,
  SaleSchema,
} from '@xangarro/domain';
import { ErrorCodeSchema } from './errors.js';
import { MAX_PUSH_DELTAS } from './transport.js';
import { wireSchema } from './wire.js';
import type { PushableTable } from './scope.js';

const OpSchema = z.enum(['insert', 'update']);

function delta<T extends PushableTable, S extends z.ZodType>(table: T, row: S) {
  return z.object({
    table: z.literal(table),
    rowId: z.string().min(1),
    op: OpSchema,
    clientSeq: z.number().int().nonnegative(),
    row: wireSchema(row),
  });
}

/** Every pushable table with its row schema — the single place this mapping lives. */
export const PUSH_ROW_SCHEMAS = {
  sales: SaleSchema,
  expenses: ExpenseSchema,
  inventory_movements: InventoryMovementSchema,
  caja_turnos: CajaTurnoSchema,
  caja_movimientos: CajaMovimientoSchema,
  cancelacion_logs: CancelacionLogSchema,
  day_closes: DayCloseSchema,
  client_payments: ClientPaymentSchema,
  entregas_credito: EntregaCreditoSchema,
  conversions: ConversionSchema,
  auditorias_inventario: AuditoriaInventarioSchema,
  products: ProductSchema,
  clients: ClientSchema,
} as const satisfies Record<PushableTable, z.ZodType>;

export const DeltaSchema = z.discriminatedUnion('table', [
  delta('sales', SaleSchema),
  delta('expenses', ExpenseSchema),
  delta('inventory_movements', InventoryMovementSchema),
  delta('caja_turnos', CajaTurnoSchema),
  delta('caja_movimientos', CajaMovimientoSchema),
  delta('cancelacion_logs', CancelacionLogSchema),
  delta('day_closes', DayCloseSchema),
  delta('client_payments', ClientPaymentSchema),
  delta('entregas_credito', EntregaCreditoSchema),
  delta('conversions', ConversionSchema),
  delta('auditorias_inventario', AuditoriaInventarioSchema),
  delta('products', ProductSchema),
  delta('clients', ClientSchema),
]);
export type Delta = z.infer<typeof DeltaSchema>;

export const PushRequestSchema = z.object({
  deltas: z.array(DeltaSchema).min(1).max(MAX_PUSH_DELTAS),
});
export type PushRequest = z.infer<typeof PushRequestSchema>;

export const AcceptedRowSchema = z.object({
  rowId: z.string().min(1),
  clientSeq: z.number().int().nonnegative(),
  serverSeq: z.number().int().positive(),
});
export const RejectedRowSchema = z.object({
  rowId: z.string().min(1),
  clientSeq: z.number().int().nonnegative(),
  code: ErrorCodeSchema,
  message: z.string().min(1),
  retryable: z.boolean(),
});
export const PushResponseSchema = z.object({
  accepted: z.array(AcceptedRowSchema),
  rejected: z.array(RejectedRowSchema),
  serverSeq: z.number().int().nonnegative(),
  serverTime: z.string().datetime(),
});
export type PushResponse = z.infer<typeof PushResponseSchema>;
export type RejectedRow = z.infer<typeof RejectedRowSchema>;
