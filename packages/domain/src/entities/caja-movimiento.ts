/**
 * CajaMovimiento — manual cash deposits/withdrawals during a turn.
 *
 * Part of the Caja Completa feature: operators can add or remove
 * cash from the drawer mid-turn (e.g. bank deposit, change top-up).
 * Each movimiento is tied to a CajaTurno and tracked in the live
 * balance formula.
 */

import { z } from 'zod';
import type { CajaMovimientoId, CajaTurnoId, BusinessId, UserId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
import { moneyField } from './_fields.js';

export const CajaMovimientoTipoEnum = z.enum(['deposito', 'retiro']);
export type CajaMovimientoTipo = z.infer<typeof CajaMovimientoTipoEnum>;

export const CajaMovimientoSchema = z
  .object({
    id: ulidField<CajaMovimientoId>(),
    turnoId: ulidField<CajaTurnoId>(),
    tipo: CajaMovimientoTipoEnum,
    montoCentavos: moneyField,
    motivo: z.string().min(1).max(200),
    userId: ulidField<UserId>(),
  })
  .merge(auditSchema);

export type CajaMovimiento = z.infer<typeof CajaMovimientoSchema>;

/** Input for creating a new caja movimiento. */
export const NewCajaMovimientoSchema = z.object({
  turnoId: ulidField<CajaTurnoId>(),
  tipo: CajaMovimientoTipoEnum,
  montoCentavos: moneyField,
  motivo: z.string().min(1).max(200),
  userId: ulidField<UserId>(),
  businessId: ulidField<BusinessId>(),
});

export type NewCajaMovimiento = z.infer<typeof NewCajaMovimientoSchema>;
