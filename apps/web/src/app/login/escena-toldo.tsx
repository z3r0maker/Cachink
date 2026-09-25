import { colors } from '@xangarro/tokens';

/**
 * The storefront's striped awning, drawn on a fixed `648×68` canvas (the
 * design's own coordinates): twelve stripes clipped to one outline with
 * rounded top corners and a scalloped hem, then that same outline stroked
 * once. One shape, so there is no seam between the band and the scallops.
 */
const W = 648;
const BAND = 42;
const DEPTH = 26;
const STRIPES = 12;
const STROKE = 3;
const CORNER = 12;

function outline(): string {
  const s = W / STRIPES;
  let d = `M0,${CORNER} Q0,0 ${CORNER},0 H${W - CORNER} Q${W},0 ${W},${CORNER} V${BAND}`;
  for (let i = STRIPES - 1; i >= 0; i -= 1) d += ` A${s / 2},${DEPTH} 0 0,1 ${i * s},${BAND}`;
  return `${d} Z`;
}

const D = outline();

export function Toldo({ className }: { readonly className: string }) {
  const s = W / STRIPES;
  return (
    <svg
      className={className}
      viewBox={`${-STROKE} ${-STROKE} ${W + 2 * STROKE} ${BAND + DEPTH + 2 * STROKE}`}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="toldo-forma">
          <path d={D} />
        </clipPath>
      </defs>
      <g clipPath="url(#toldo-forma)">
        {Array.from({ length: STRIPES }, (_, i) => (
          <rect
            key={i}
            x={i * s}
            y={0}
            width={s + 0.5}
            height={BAND + DEPTH}
            fill={i % 2 === 0 ? colors.black : colors.white}
          />
        ))}
      </g>
      <path d={`M0,${BAND} H${W}`} stroke={colors.black} strokeWidth={STROKE * 0.8} fill="none" />
      <path d={D} fill="none" stroke={colors.black} strokeWidth={STROKE} strokeLinejoin="round" />
    </svg>
  );
}
