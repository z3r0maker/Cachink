import { formatMoneyEntero } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import type { DonutSlice } from './charts-data';
import {
  barrido,
  donutFila,
  donutLista,
  donutMonto,
  donutSwatch,
  donutTitulo,
} from './estados.css';

/**
 * The composition donut — drawn from the design's own `120×120` canvas (C-13).
 *
 * The black ring is the trick: a `26`-wide stroke sits behind the `22`-wide
 * coloured one, so every slice gets the house's 2px border without drawing
 * eight separate arcs. A white `r 33` disc with a 2px border punches the hole,
 * and the total is printed inside it — the previous Recharts donut had no
 * centre text and pushed its legend off the bottom of the card.
 */
const R = 44;
const CIRC = 2 * Math.PI * R;

/** Each donut has its own four-colour run, as the design sets them. */
export const PALETA_INGRESOS = [colors.green, colors.blue, colors.warning, colors.purple] as const;
export const PALETA_EGRESOS = [colors.red, colors.blue, colors.warning, colors.cyan] as const;

const color = (paleta: readonly string[], i: number) => paleta[i % paleta.length] as string;

/**
 * `stroke-dasharray` + `stroke-dashoffset` place one arc: the gap before it is
 * the run already drawn. Arcs start at 12 o'clock (`rotate(-90)`), like the
 * design's.
 */
function arcos(slices: readonly DonutSlice[], total: number, paleta: readonly string[]) {
  let recorrido = 0;
  return slices.map((s, i) => {
    const largo = total === 0 ? 0 : (Number(s.monto) / total) * CIRC;
    const antes = recorrido;
    recorrido += largo;
    return { key: s.label, largo, antes, fill: color(paleta, i) };
  });
}

function Anillo({
  slices,
  total,
  paleta,
  etiqueta,
}: {
  readonly slices: readonly DonutSlice[];
  readonly total: number;
  readonly paleta: readonly string[];
  readonly etiqueta: string;
}) {
  const cifras = formatMoneyEntero(BigInt(Math.round(total)));
  return (
    <svg viewBox="0 0 120 120" style={{ width: 164, height: 164, flex: 'none', display: 'block' }}>
      <g className={barrido} style={{ transformBox: 'view-box', transformOrigin: '60px 60px' }}>
        <circle cx={60} cy={60} r={R} fill="none" stroke={colors.black} strokeWidth={26} />
        {arcos(slices, total, paleta).map((a) => (
          <circle
            key={a.key}
            cx={60}
            cy={60}
            r={R}
            fill="none"
            stroke={a.fill}
            strokeWidth={22}
            strokeDasharray={`${a.largo} ${CIRC - a.largo}`}
            strokeDashoffset={-a.antes}
            transform="rotate(-90 60 60)"
          />
        ))}
      </g>
      <Centro etiqueta={etiqueta} cifras={cifras} />
    </svg>
  );
}

/** The white hole and what is written in it. */
function Centro({ etiqueta, cifras }: { readonly etiqueta: string; readonly cifras: string }) {
  return (
    <>
      <circle cx={60} cy={60} r={33} fill={colors.white} stroke={colors.black} strokeWidth={2} />
      <text x={60} y={55} textAnchor="middle" fontSize={10} fontWeight={700} fill={colors.gray600}>
        {etiqueta}
      </text>
      <text
        x={60}
        y={70}
        textAnchor="middle"
        // The hole is 66 wide. The design's sample fits at 14; a longer total
        // does not, so it steps down rather than spilling over the ring — the
        // same rule the ticket's TOTAL uses.
        fontSize={cifras.length > 7 ? 12 : 14}
        fontWeight={800}
        fill={colors.black}
      >
        {cifras}
      </text>
    </>
  );
}

function Leyenda({
  slices,
  total,
  paleta,
}: {
  readonly slices: readonly DonutSlice[];
  readonly total: number;
  readonly paleta: readonly string[];
}) {
  return (
    <ul className={donutLista}>
      {slices.map((s, i) => (
        <li key={s.label} className={donutFila}>
          <span
            className={donutSwatch}
            style={{ background: color(paleta, i) }}
            aria-hidden="true"
          />
          {s.label}
          <span className={donutMonto}>
            {formatMoneyEntero(s.monto)} ·{' '}
            {total === 0 ? 0 : Math.round((Number(s.monto) / total) * 100)}%
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Its spoken form: every slice with its money, in draw order. */
function hablado(slices: readonly DonutSlice[], vacio: string): string {
  if (slices.length === 0) return vacio;
  return slices.map((s) => `${s.label} ${formatMoneyEntero(s.monto)}`).join(', ');
}

export function DonutSvg({
  titulo,
  etiqueta,
  slices,
  paleta,
  vacio,
}: {
  readonly titulo: string;
  /**
   * The uppercase line inside the hole. The design writes «TOTAL INGRESOS»,
   * which is wider than the 66px hole at the size it also specifies — so the
   * word that carries the meaning stays and «TOTAL» goes.
   */
  readonly etiqueta: string;
  readonly slices: readonly DonutSlice[];
  readonly paleta: readonly string[];
  readonly vacio: string;
}) {
  const total = slices.reduce((a, s) => a + Number(s.monto), 0);
  return (
    <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
      <div role="img" aria-label={`${titulo}: ${hablado(slices, vacio)}`}>
        <Anillo slices={slices} total={total} paleta={paleta} etiqueta={etiqueta} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h3 className={donutTitulo}>{titulo}</h3>
        {slices.length === 0 ? (
          <p>{vacio}</p>
        ) : (
          <Leyenda slices={slices} total={total} paleta={paleta} />
        )}
      </div>
    </div>
  );
}
