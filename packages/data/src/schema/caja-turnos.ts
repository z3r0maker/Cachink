/**
 * CajaTurnos table — cash drawer turns.
 *
 * Phase 6 of the Feature Flags plan: Caja.
 */

import { sqliteTable, text, numeric } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const cajaTurnos = sqliteTable('caja_turnos', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  fecha: text('fecha').notNull(),
  aperturaAt: text('apertura_at').notNull(),
  cierreAt: text('cierre_at'),
  montoAperturaCentavos: numeric('monto_apertura_centavos', { mode: 'bigint' }).notNull(),
  efectivoAdicionalCentavos: numeric('efectivo_adicional_centavos', { mode: 'bigint' }).notNull(),
  montoCierreCentavos: numeric('monto_cierre_centavos', { mode: 'bigint' }),
  efectivoEsperadoCentavos: numeric('efectivo_esperado_centavos', { mode: 'bigint' }),
  diferenciaCentavos: numeric('diferencia_centavos', { mode: 'bigint' }),
  discrepancyReason: text('discrepancy_reason'),
  explicacion: text('explicacion'),
  totalTransferencias: numeric('total_transferencias', { mode: 'bigint' }).notNull().default(0n),
  totalTarjeta: numeric('total_tarjeta', { mode: 'bigint' }).notNull().default(0n),
  totalQr: numeric('total_qr', { mode: 'bigint' }).notNull().default(0n),
  totalCredito: numeric('total_credito', { mode: 'bigint' }).notNull().default(0n),
  egresoAutoId: text('egreso_auto_id'),
  conteoCentavos: numeric('conteo_centavos', { mode: 'bigint' }),
  conteoAt: text('conteo_at'),
  ...auditColumns,
});
