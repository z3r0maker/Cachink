import { colors } from '@xangarro/tokens';

import { aguja } from './charts.css';
import { bandasDeGauge, puntaDeAguja } from './chart-geo';

/**
 * The Indicadores gauge (C-13) — the design's own `180×106` canvas.
 *
 * A `r 70` semicircle from (20,90) to (160,90), painted in three bands and
 * outlined `2px`, with a `4px` needle from the centre to `r 62` and a yellow
 * `r 7` hub. The bands are one arc drawn three times with different dash
 * patterns, which is how the design does it: cheaper than three arc paths and
 * they can never disagree about where a band ends.
 *
 * Indicadores rendered plain KPI cards before this; the verdict was a word,
 * with nothing to show how close to the edge the number sat.
 */
const CX = 90;
const CY = 90;
const ARCO = 'M20 90 A70 70 0 0 1 160 90';

/** The band colours, in the order `bandasDeGauge` returns them. */
const TINTA = {
  critical: colors.red,
  warning: colors.warning,
  healthy: colors.green,
} as const;

export interface GaugeProps {
  /** The metric's value on its own scale — 0.383 for a 38.3% margin. */
  readonly valor: number;
  /** Where the warning band starts, and where the healthy one does. */
  readonly lo: number;
  readonly hi: number;
  /** The dial's ceiling. The design picks one per metric, not a formula. */
  readonly max: number;
}

export function GaugeSvg({ valor, lo, hi, max }: GaugeProps) {
  const p = puntaDeAguja(valor / max);
  return (
    <svg
      viewBox="0 0 180 106"
      style={{
        width: '100%',
        maxWidth: 220,
        height: 'auto',
        margin: '10px auto 0',
        display: 'block',
      }}
      aria-hidden="true"
    >
      {bandasDeGauge(lo, hi, max).map((b) => (
        <path
          key={b.banda}
          d={ARCO}
          fill="none"
          stroke={TINTA[b.banda]}
          strokeWidth={16}
          strokeDasharray={b.dash}
        />
      ))}
      <path d={ARCO} fill="none" stroke={colors.black} strokeWidth={2} />
      <line
        className={aguja}
        x1={CX}
        y1={CY}
        x2={p.x.toFixed(1)}
        y2={p.y.toFixed(1)}
        stroke={colors.black}
        strokeWidth={4}
        strokeLinecap="round"
        style={{ transformBox: 'view-box', transformOrigin: `${CX}px ${CY}px` }}
      />
      <circle cx={CX} cy={CY} r={7} fill={colors.yellow} stroke={colors.black} strokeWidth={2.5} />
    </svg>
  );
}
