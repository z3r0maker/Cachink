import {
  PLATFORM_FLAG_DEFAULTS,
  PLATFORM_FLAG_KEYS,
  type PlatformFlag,
  type PlatformFlagKey,
  type StaffMemberId,
} from '@xangarro/domain';

import { FlagError, flagStore } from './errors';
import type { PlatformFlagEvent, PlatformFlagStore } from './port';
import { flagState, type FlagState } from './state';

/** How many past changes the history drawer shows. */
export const HISTORY_LIMIT = 50;

export interface FlagOverviewDeps {
  readonly store: PlatformFlagStore;
}

export interface LastChange {
  readonly at: string;
  readonly reason: string;
  /** Staff name, or the id when that person is no longer on the allowlist. */
  readonly by: string;
}

export interface FlagRow {
  readonly key: PlatformFlagKey;
  readonly state: FlagState;
  readonly defaultOn: boolean;
  readonly lastChange: LastChange | null;
}

export interface FlagOverview {
  readonly rows: readonly FlagRow[];
  readonly tenantCount: number;
}

export interface HistoryEntry extends PlatformFlagEvent {
  readonly by: string;
}

async function names(
  store: PlatformFlagStore,
  flags: readonly PlatformFlag[],
): Promise<(id: StaffMemberId) => string> {
  const ids = [...new Set(flags.map((f) => f.updatedBy))];
  const known = ids.length === 0 ? new Map() : await flagStore(() => store.staffNames(ids));
  return (id) => known.get(id) ?? id;
}

/** Every key in catalogue order, with where it stands and who last touched it. */
export async function listFlags(deps: FlagOverviewDeps): Promise<FlagOverview> {
  const [current, tenantCount] = await Promise.all([
    flagStore(() => deps.store.current()),
    flagStore(() => deps.store.tenantCount()),
  ]);
  const nameOf = await names(deps.store, current);
  const rows = PLATFORM_FLAG_KEYS.map((key): FlagRow => {
    const row = current.find((f) => f.key === key);
    return {
      key,
      state: flagState(key, current),
      defaultOn: PLATFORM_FLAG_DEFAULTS[key],
      lastChange: row ? { at: row.updatedAt, reason: row.reason, by: nameOf(row.updatedBy) } : null,
    };
  });
  return { rows, tenantCount };
}

/** One key's changes, newest first — the history drawer. */
export async function flagHistory(deps: FlagOverviewDeps, key: string): Promise<HistoryEntry[]> {
  const k = PLATFORM_FLAG_KEYS.find((candidate) => candidate === key);
  if (k === undefined) throw new FlagError('VALIDATION', 'Ese flag no existe.');
  const events = await flagStore(() => deps.store.history(k, HISTORY_LIMIT));
  const nameOf = await names(deps.store, events);
  return events.map((e) => ({ ...e, by: nameOf(e.updatedBy) }));
}
