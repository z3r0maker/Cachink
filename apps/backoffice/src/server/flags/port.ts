/**
 * Ports for the platform-flag page (N-09). The use cases in this folder depend
 * on these only; `memory.ts` implements them for tests and
 * `../db/platform-flags.ts` for Postgres. Both honour the same contract:
 *
 * - `append` adds one event; there is no update and no delete
 *   (`0005_platform_flags.sql` grants SELECT and INSERT only).
 * - `current` is the latest event per key — keys never set are absent.
 * - `history` is one key's events, newest first, at most `limit`.
 */
import type {
  PlatformFlag,
  PlatformFlagEventId,
  PlatformFlagKey,
  StaffMemberId,
} from '@xangarro/domain';

export interface PlatformFlagEvent extends PlatformFlag {
  readonly id: PlatformFlagEventId;
}

export interface PlatformFlagStore {
  append(event: PlatformFlagEvent): Promise<void>;
  current(): Promise<PlatformFlag[]>;
  history(key: PlatformFlagKey, limit: number): Promise<PlatformFlagEvent[]>;
  /** Every business on the platform — what «apagar para todos» reaches. */
  tenantCount(): Promise<number>;
  /** Display names for the authors of changes; unknown ids are absent. */
  staffNames(ids: readonly StaffMemberId[]): Promise<Map<StaffMemberId, string>>;
}
