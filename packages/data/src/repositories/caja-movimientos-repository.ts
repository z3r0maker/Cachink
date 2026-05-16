/**
 * CajaMovimientosRepository — CRUD for manual cash deposits/withdrawals.
 *
 * Part of the Caja Completa feature.
 */

import type { CajaMovimiento, NewCajaMovimiento } from '@cachink/domain';
import type { CajaMovimientoId, CajaTurnoId, BusinessId } from '@cachink/domain';

export type { CajaMovimiento, NewCajaMovimiento };

export interface CajaMovimientosRepository {
  /** Create a new deposit or withdrawal record. */
  create(input: NewCajaMovimiento): Promise<CajaMovimiento>;

  /** Find a movimiento by ID. */
  findById(id: CajaMovimientoId): Promise<CajaMovimiento | null>;

  /** List all movimientos for a given turn, ordered by createdAt asc. */
  findByTurno(turnoId: CajaTurnoId): Promise<readonly CajaMovimiento[]>;

  /** List movimientos in a date range for a business (for history screen). */
  findByDateRange(
    from: string,
    to: string,
    businessId: BusinessId,
  ): Promise<readonly CajaMovimiento[]>;
}
