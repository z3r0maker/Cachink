'use client';

import { formatMoney, formatMoneyCompact } from '@xangarro/domain';
import { colors, portalFontSizes } from '@xangarro/tokens';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card } from '@/components';
import type { Desglose, EstadoDeResultados } from '@xangarro/domain';

import { donutEgresos, donutIngresos, waterfallDeResultados, type DonutSlice } from './charts-data';
import { chartNote, chartTitle, donutGrid } from './estados.css';

/** Token names → the fills the donuts draw with. */
const FILL: Record<string, string> = {
  yellow: colors.yellow,
  blue: colors.blue,
  green: colors.green,
  purple: colors.purple,
  peach: colors.peachSoft,
  cyan: colors.cyan,
  red: colors.red,
  gray: colors.gray400,
};

const money = (v: unknown) => formatMoney(BigInt(Math.round(Number(v))));

/**
 * The Resultados waterfall (P-14): ingresos → costos → utilidad bruta →
 * gastos → utilidad operativa → ISR → utilidad neta, as floating bars over an
 * invisible base — the standard Recharts waterfall. Steps at zero are omitted,
 * so a month with no merma and no ISR draws five bars, not seven.
 *
 * **Provisional** (the design file is not mirrored, O-23): the shape comes
 * from the statement's own identities, which `tests/charts-data.test.ts`
 * pins; `design:compare` reconciles it when the design lands.
 */
export function Waterfall({ er }: { readonly er: EstadoDeResultados }) {
  const steps = waterfallDeResultados(er);
  const max = Math.max(...steps.map((s) => s.base + s.delta), 1);
  return (
    <Card>
      <h3 className={chartTitle}>Cómo llegaste a tu utilidad</h3>
      <div style={{ height: 280 }} role="img" aria-label="Cascada del Estado de Resultados">
        <ResponsiveContainer>
          <BarChart
            data={steps as unknown as object[]}
            margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
          >
            <CartesianGrid stroke={colors.gray200} vertical={false} />
            <XAxis dataKey="label" interval={0} tick={{ fontSize: portalFontSizes.xs }} />
            <YAxis
              tickFormatter={(v) => formatMoneyCompact(BigInt(Math.round(Number(v))))}
              width={72}
              domain={[0, Math.ceil(max * 1.05)]}
            />
            <Tooltip
              cursor={false}
              formatter={(v, name) => (name === 'base' ? '' : money(v))}
              labelFormatter={(l) => String(l)}
            />
            <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="delta" stackId="w" isAnimationActive={false}>
              {steps.map((s) => (
                <Cell key={s.label} fill={s.kind === 'total' ? colors.yellow : colors.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className={chartNote}>
        Las barras amarillas son los niveles de la utilidad; las rojas, lo que se restó en el
        camino.
      </p>
    </Card>
  );
}

/** The donut's spoken form: every slice with its money, in draw order. */
function donutLabel(slices: readonly { label: string; value: number }[], vacio: string): string {
  const partes = slices.map((s) => `${s.label} ${formatMoney(BigInt(Math.round(s.value)))}`);
  return partes.length === 0 ? vacio : partes.join(', ');
}

/** The pie itself, split out so `Donut` stays a card. */
function DonutPie({ slices }: { readonly slices: readonly DonutSlice[] }) {
  return (
    <Pie
      data={slices as unknown as object[]}
      dataKey="value"
      nameKey="label"
      innerRadius="55%"
      outerRadius="80%"
      isAnimationActive={false}
      stroke={colors.black}
      strokeWidth={1.5}
    >
      {slices.map((s) => (
        <Cell key={s.label} fill={FILL[s.color] ?? colors.gray400} />
      ))}
    </Pie>
  );
}

/** One donut over `Desglose` partidas — ingresos by method, egresos by category. */
function Donut({
  title,
  slices,
  vacio,
}: {
  readonly title: string;
  readonly slices: readonly { label: string; value: number; color: string }[];
  readonly vacio: string;
}) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  return (
    <Card>
      <h3 className={chartTitle}>{title}</h3>
      <div style={{ height: 220 }} role="img" aria-label={`${title}: ${donutLabel(slices, vacio)}`}>
        <ResponsiveContainer>
          <PieChart>
            <DonutPie slices={slices} />
            <Tooltip formatter={money} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className={chartNote}>
        {total === 0 ? vacio : `Total: ${formatMoney(BigInt(Math.round(total)))}.`}
      </p>
    </Card>
  );
}

/** The two composition donuts under the Resultados statement. */
export function Donuts({ desglose }: { readonly desglose: Desglose }) {
  return (
    <div className={donutGrid}>
      <Donut
        title="Ingresos por método"
        slices={donutIngresos(desglose)}
        vacio="Sin ingresos en el periodo."
      />
      <Donut
        title="Egresos por categoría"
        slices={donutEgresos(desglose)}
        vacio="Sin egresos en el periodo."
      />
    </div>
  );
}
