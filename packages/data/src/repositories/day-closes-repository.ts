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
  delete(id: DayCloseId): Promise<void>;
}
