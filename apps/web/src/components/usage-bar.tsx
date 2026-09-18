import { colors } from '@xangarro/tokens';

import { barFill, barTrack } from './option-card.css';

export interface UsageBarProps {
  readonly used: number;
  /** `null` means an uncapped allowance — no bar is drawn. */
  readonly limit: number | null;
  /** Required: a progressbar without a name is unreadable to a screen reader. */
  readonly label: string;
}

/**
 * **Only capped allowances render a bar.**
 *
 * Drawing a bar against an unlimited quota misreports it (design handoff,
 * Suscripción). An uncapped allowance renders nothing here; the caller shows
 * "N · sin límite" as text instead.
 */
export function UsageBar({ used, limit, label }: UsageBarProps) {
  if (limit === null || limit <= 0) return null;
  const ratio = Math.min(used / limit, 1);
  const fill = ratio >= 1 ? colors.warning : colors.yellow;
  return (
    <div
      className={barTrack}
      role="progressbar"
      aria-label={label}
      aria-valuenow={used}
      aria-valuemin={0}
      aria-valuemax={limit}
    >
      <span className={barFill} style={{ width: `${ratio * 100}%`, background: fill }} />
    </div>
  );
}
