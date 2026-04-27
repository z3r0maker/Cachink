/**
 * DayClosesRepository — nightly cash reconciliation (CLAUDE.md §1).
 * One DayClose per device per day is an app-layer invariant; this repo
 * surfaces the lookups P1B-M6-T05 (CerrarCorteDeDiaUseCase) needs.
 */

import type {
  BusinessId,
  DayClose,
  DayCloseId,
  DeviceId,
  IsoDate,
  NewDayClose,
} from '@cachink/domain';

export type { DayClose, NewDayClose };

export interface DayClosesRepository {
  create(input: NewDayClose): Promise<DayClose>;
  findById(id: DayCloseId): Promise<DayClose | null>;
  /** Look up today's corte on a given device — enforces the one-per-day rule. */
  findByDate(date: IsoDate, deviceId: DeviceId): Promise<DayClose | null>;
  /** Most recent corte (any device) for a business — used to seed saldoAnterior. */
  findLatest(businessId: BusinessId): Promise<DayClose | null>;
  /**
   * List all non-deleted cortes in `[from, to]` (inclusive) for a
   * business. Powers the Balance General cash line + the corte
   * historial strip (P1C-M7 / M8). Rows ordered newest first by fecha.
   */
  findByDateRange(from: IsoDate, to: IsoDate, businessId: BusinessId): Promise<readonly DayClose[]>;
  delete(id: DayCloseId): Promise<void>;
}
