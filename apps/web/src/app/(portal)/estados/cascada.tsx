import { formatMoneyEntero } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import type { WaterfallStep } from './charts-data';
import { crece } from './estados.css';

/**
 * «Cascada de resultados» — drawn, not charted (C-13).
 *
 * Transcribed from «Xangarro Portal - Estados financieros.dc.html»: a
 * `560×214` canvas, bars `46` wide at a `66` pitch, every rect bordered
 * `2px --black` with `rx 3`, one `2px` baseline rule and `1.5px` leaders
 * joining each bar to the next. There is **no axis and no grid** — the value
 * is printed above its own bar and the category below it, alternating two
 * rows so long names do not collide. The previous Recharts version brought
 * gridlines, tick labels, a tooltip and a legend, none of which the design
 * has, and left the marks unbordered.
 *
 * The canvas is fixed, so the numbers below are the design's own coordinates
 * rather than tokens — the same exception `design-lint` grants the login
 * animation.
 */
const W = 560;
const ALTO = 214;
const BARRA = 46;
const X0 = 26;
const ANCHO_UTIL = W - 2 * X0;
const ARRIBA = 38;
const ABAJO = 168;
const ALTURA = ABAJO - ARRIBA;

interface Caja {
  readonly step: WaterfallStep;
  readonly x: number;
  readonly arriba: number;
  readonly abajo: number;
}

/** Where zero sits, and the value→y map. A loss pushes zero up the canvas. */
function escala(steps: readonly WaterfallStep[]) {
  const vistos = steps.flatMap((s) => [Number(s.desde), Number(s.hasta), 0]);
  const alto = Math.max(...vistos);
  const bajo = Math.min(...vistos);
  const rango = alto - bajo || 1;
  return (v: number) => ARRIBA + ((alto - v) / rango) * ALTURA;
}

function cajas(steps: readonly WaterfallStep[]): readonly Caja[] {
  const y = escala(steps);
  const paso = steps.length > 1 ? (ANCHO_UTIL - BARRA) / (steps.length - 1) : 0;
  return steps.map((step, i) => {
    const a = y(Number(step.desde));
    const b = y(Number(step.hasta));
    return { step, x: X0 + i * paso, arriba: Math.min(a, b), abajo: Math.max(a, b) };
  });
}

/** Green is what you keep, blue a running subtotal, red what was taken, amber the ISR. */
function relleno(step: WaterfallStep, i: number, n: number): string {
  if (step.kind === 'resta') return step.label === 'ISR' ? colors.warning : colors.red;
  if (step.acumulado < 0n) return colors.red;
  return i === 0 || i === n - 1 ? colors.green : colors.blue;
}

function tinta(step: WaterfallStep): string {
  if (step.kind !== 'resta') return colors.black;
  return step.label === 'ISR' ? colors.warningText : colors.redText;
}

/** «Costo de ventas» never fits under a 46px bar; the design shortens them. */
const CORTO: Record<string, string> = {
  'Costo de ventas': 'Costo vtas',
  'Utilidad bruta': 'Ut. bruta',
  'Gastos operativos': 'Gastos op.',
  'Utilidad operativa': 'Ut. operativa',
  'Utilidad neta': 'Ut. neta',
};

/** The amount over the bar, and the category under the plot. */
function Rotulos({ c, i }: { readonly c: Caja; readonly i: number }) {
  const medio = c.x + BARRA / 2;
  const baja = c.step.kind === 'resta';
  return (
    <>
      <text
        x={medio}
        y={c.arriba - 8}
        textAnchor="middle"
        fontSize={12}
        fontWeight={800}
        fill={tinta(c.step)}
      >
        {baja ? '−' : ''}
        {formatMoneyEntero(baja ? c.step.monto : c.step.acumulado)}
      </text>
      {/* Two rows, alternating, so «Ut. operativa» never touches its neighbour. */}
      <text
        x={medio}
        y={ABAJO + (i % 2 === 0 ? 18 : 36)}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill={colors.gray600}
      >
        {CORTO[c.step.label] ?? c.step.label}
      </text>
    </>
  );
}

function Barra({ c, i, n }: { readonly c: Caja; readonly i: number; readonly n: number }) {
  const baja = c.step.kind === 'resta';
  return (
    <g>
      <rect
        className={crece}
        x={c.x}
        y={c.arriba}
        width={BARRA}
        height={Math.max(c.abajo - c.arriba, 3)}
        rx={3}
        fill={relleno(c.step, i, n)}
        stroke={colors.black}
        strokeWidth={2}
        // Each bar grows from the level it starts at: a drop unrolls downward.
        style={{ transformOrigin: baja ? 'top' : 'bottom', animationDelay: `${i * 60}ms` }}
      />
      <Rotulos c={c} i={i} />
    </g>
  );
}

/** The 1.5px leader from one bar's edge to the next — what makes it a cascade. */
function Enlace({ a, b }: { readonly a: Caja; readonly b: Caja }) {
  const y = a.step.kind === 'resta' ? a.abajo : a.arriba;
  return (
    <path
      d={`M${a.x + BARRA} ${y} L${b.x} ${y}`}
      stroke={colors.black}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  );
}

export function CascadaSvg({ steps }: { readonly steps: readonly WaterfallStep[] }) {
  const cs = cajas(steps);
  const cero = escala(steps)(0);
  return (
    <svg
      viewBox={`0 0 ${W} ${ALTO}`}
      style={{ width: '100%', height: 'auto', marginTop: 16, display: 'block' }}
    >
      <path
        d={`M20 ${cero} L${W - 16} ${cero}`}
        stroke={colors.black}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {cs.slice(0, -1).map((a, i) => (
        <Enlace key={`e-${a.step.label}`} a={a} b={cs[i + 1] as Caja} />
      ))}
      {cs.map((c, i) => (
        <Barra key={c.step.label} c={c} i={i} n={cs.length} />
      ))}
    </svg>
  );
}
