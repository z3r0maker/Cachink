/**
 * CajaTurnosRepository — CRUD for cash drawer turns.
 *
 * Phase 6 of the Feature Flags plan: Caja.
 */

import type { CajaTurno } from '@cachink/domain';
import type { BusinessId, CajaTurnoId, UserId } from '@cachink/domain';

export type { CajaTurno };

/** Patchable fields for closing a turn (includes blind-close fields). */
export type CajaTurnoPatch = Partial<
  Pick<
    CajaTurno,
    | 'cierreAt'
    | 'montoCierreCentavos'
    | 'efectivoEsperadoCentavos'
    | 'diferenciaCentavos'
    | 'discrepancyReason'
    | 'explicacion'
    | 'totalTransferencias'
    | 'totalTarjeta'
    | 'totalQr'
    | 'totalCredito'
    | 'egresoAutoId'
    | 'conteoCentavos'
    | 'conteoAt'
  >
>;

/** Input for creating a turn — audit fields filled by repo. */
export interface CreateCajaTurnoInput {
  readonly userId: UserId;
  readonly fecha: string;
  readonly aperturaAt: string;
  readonly montoAperturaCentavos: bigint;
  readonly efectivoAdicionalCentavos: bigint;
  readonly businessId: BusinessId;
}

export interface CajaTurnosRepository {
  create(input: CreateCajaTurnoInput): Promise<CajaTurno>;
  findById(id: CajaTurnoId): Promise<CajaTurno | null>;
  /** Find the currently open turn for a user (cierreAt IS NULL). */
  findOpenByUser(userId: UserId): Promise<CajaTurno | null>;
  /** Find the most recent turn for a business. */
  findLatest(businessId: BusinessId): Promise<CajaTurno | null>;
  /** List turns in a date range, newest first. */
  findByDateRange(
    from: string,
    to: string,
    businessId: BusinessId,
  ): Promise<readonly CajaTurno[]>;
  /** Partial update for closing a turn. */
  update(id: CajaTurnoId, patch: CajaTurnoPatch): Promise<CajaTurno>;
}
