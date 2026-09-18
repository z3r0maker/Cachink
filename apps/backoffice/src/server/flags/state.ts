import {
  PLATFORM_FLAG_DEFAULTS,
  type BusinessId,
  type PlatformFlag,
  type PlatformFlagKey,
  type PlatformFlagMode,
} from '@xangarro/domain';

/**
 * Where a key stands right now: its latest event, or — with no event — its
 * code default expressed as a mode. `source` tells the page which it is.
 */
export interface FlagState {
  readonly mode: PlatformFlagMode;
  readonly source: 'row' | 'default';
  readonly allowlistBusinessIds: readonly BusinessId[];
}

export function defaultMode(key: PlatformFlagKey): PlatformFlagMode {
  return PLATFORM_FLAG_DEFAULTS[key] ? 'on' : 'off';
}

export function flagState(key: PlatformFlagKey, current: readonly PlatformFlag[]): FlagState {
  const row = current.find((f) => f.key === key);
  if (row === undefined)
    return { mode: defaultMode(key), source: 'default', allowlistBusinessIds: [] };
  return { mode: row.mode, source: 'row', allowlistBusinessIds: row.allowlistBusinessIds };
}

/** Same mode and the same list (order ignored). */
export function sameState(
  a: Pick<FlagState, 'mode' | 'allowlistBusinessIds'>,
  b: Pick<FlagState, 'mode' | 'allowlistBusinessIds'>,
): boolean {
  if (a.mode !== b.mode) return false;
  const sa = [...a.allowlistBusinessIds].sort();
  const sb = [...b.allowlistBusinessIds].sort();
  return sa.length === sb.length && sa.every((id, i) => id === sb[i]);
}
