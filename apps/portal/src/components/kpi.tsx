import type { ReactNode } from 'react';

import { Card } from './card';
import { dot } from './tag.css';
import {
  deltaLine,
  deltaTone,
  kpiEyebrow,
  kpiFigure,
  kpiFigureTone,
  kpiHint,
  verdict,
  verdictTone,
} from './kpi.css';

export type FigureTone = 'neutral' | 'positive' | 'negative' | 'warning';

export interface KpiCardProps {
  readonly label: string;
  /** Already formatted — `Intl` es-MX is a presentation concern of the caller. */
  readonly value: string;
  readonly tone?: FigureTone;
  readonly hint?: string;
  readonly children?: ReactNode;
}

export function KpiCard({ label, value, tone = 'neutral', hint, children }: KpiCardProps) {
  return (
    <Card>
      <span className={kpiEyebrow}>{label}</span>
      <p className={`${kpiFigure} ${kpiFigureTone[tone]}`}>{value}</p>
      {hint ? <p className={kpiHint}>{hint}</p> : null}
      {children}
    </Card>
  );
}

export interface DeltaProps {
  readonly direction: 'up' | 'down' | 'flat';
  readonly label: string;
}

/** "↑ 12% vs mes anterior". The arrow carries the meaning, not only the colour. */
export function Delta({ direction, label }: DeltaProps) {
  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '=';
  return (
    <span className={`${deltaLine} ${deltaTone[direction]}`}>
      <span aria-hidden="true">{arrow}</span>
      {label}
    </span>
  );
}

export interface VerdictProps {
  readonly tone: 'healthy' | 'warning' | 'critical';
  /**
   * Set on a yellow surface.
   *
   * The `*Text` tokens are contrast-verified against white, offwhite, gray100
   * and their own `*Soft` ground — **not** against `yellow`. `greenText` on
   * `yellow` measures 3.58:1, below AA, which axe caught on the Inicio hero.
   * On yellow the dot carries the colour and the text stays black, which is
   * also what the design draws: "a green-dot line".
   */
  readonly onYellow?: boolean;
  readonly children: ReactNode;
}

/** The plain-language health sentence that sits under a key number. */
export function Verdict({ tone, onYellow, children }: VerdictProps) {
  const dotTone = tone === 'healthy' ? 'success' : tone === 'warning' ? 'warning' : 'danger';
  return (
    <span className={onYellow ? verdict : `${verdict} ${verdictTone[tone]}`}>
      <span className={dot({ tone: dotTone })} aria-hidden="true" />
      {children}
    </span>
  );
}
