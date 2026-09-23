import { formatMoneyEntero, type FlujoDeEfectivo } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { creceX } from './charts.css';
import { EJE, escalaDeFlujo, filasDeFlujo, type FilaFlujo } from './chart-geo';

/**
 * «Entradas y salidas del periodo» — the Flujo tab's diverging bars (C-13).
 *
 * Transcribed from «Xangarro Portal - Estados financieros.dc.html»: a
 * `700×180` canvas with a `2px` zero axis down the middle, four `26`-tall rows
 * at a `36` pitch, entradas growing right in green and salidas left in red,
 * every rect bordered `2px --black` with `rx 3`. We had no chart here at all —
 * the Flujo tab rendered its statement lines and nothing else.
 */
const W = 700;
const ALTO = 180;
const BARRA = 26;
const FILAS = [18, 54, 90, 126] as const;

function Barra(props: {
  readonly f: FilaFlujo;
  readonly y: number;
  readonly largo: number;
  readonly i: number;
}) {
  const { f, y, largo } = props;
  const ancho = Math.max(largo, 3);
  const x = f.entrada ? EJE : EJE - ancho;
  return (
    <rect
      className={creceX}
      x={x}
      y={y}
      width={ancho}
      height={BARRA}
      rx={3}
      fill={f.entrada ? colors.green : colors.red}
      stroke={colors.black}
      strokeWidth={2}
      // Each bar unrolls away from the axis, so both sides start at zero.
      style={{ transformOrigin: f.entrada ? 'left' : 'right', animationDelay: `${props.i * 80}ms` }}
    />
  );
}

/** The category on the left of the axis, the amount at the bar's far end. */
function Rotulos({
  f,
  y,
  largo,
}: {
  readonly f: FilaFlujo;
  readonly y: number;
  readonly largo: number;
}) {
  const base = y + 18;
  return (
    <>
      <text x={186} y={base} textAnchor="end" fontSize={12} fontWeight={700} fill={colors.gray600}>
        {f.label}
      </text>
      {/* An entrada's figure sits outside its right edge. A salida's sits
          inside the bar, right-aligned against the axis: outside-left would
          collide with the category label, and the design's inside-left start
          runs across the axis whenever the bar is shorter than its number. */}
      <text
        x={f.entrada ? EJE + Math.max(largo, 3) + 8 : EJE - 8}
        y={base}
        textAnchor={f.entrada ? 'start' : 'end'}
        fontSize={12}
        fontWeight={800}
        fill={colors.black}
      >
        {f.entrada ? '' : '−'}
        {formatMoneyEntero(f.monto)}
      </text>
    </>
  );
}

export function FlujoBarrasSvg({ flujo }: { readonly flujo: FlujoDeEfectivo }) {
  const filas = filasDeFlujo(flujo);
  const s = escalaDeFlujo(filas);
  return (
    <svg
      viewBox={`0 0 ${W} ${ALTO}`}
      style={{ width: '100%', height: 'auto', marginTop: 16, display: 'block' }}
    >
      <path
        d={`M${EJE} 8 L${EJE} 164`}
        stroke={colors.black}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <text
        x={EJE}
        y={176}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill={colors.gray600}
      >
        $0
      </text>
      {filas.map((f, i) => {
        const y = FILAS[i] as number;
        const largo = Number(f.monto) * s;
        return (
          <g key={f.label}>
            <Barra f={f} y={y} largo={largo} i={i} />
            <Rotulos f={f} y={y} largo={largo} />
          </g>
        );
      })}
    </svg>
  );
}
