'use client';

import { formatMoney, formatMoneyCompact } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card } from '@/components';
import type { InicioData } from '@/server/inicio';

/**
 * «Últimos 30 días» (P-13): ventas against gastos per day. The series comes
 * from `serieDiaria`, whose sum the DB test holds equal to the hero's totals,
 * so the chart and the figure above it cannot disagree.
 *
 * Plotted as integer centavos (a number is what Recharts draws; centavos stay
 * exact far past any shop's month) and formatted back through `formatMoney` —
 * no float peso anywhere. The SVG is labelled, and the same totals are stated
 * in text for anyone who cannot read the chart.
 */
const dia = (fecha: string) => `${Number(fecha.slice(8, 10))}/${Number(fecha.slice(5, 7))}`;
const money = (v: unknown) => formatMoney(BigInt(Math.round(Number(v))));

type Point = { fecha: string; ventas: number; gastos: number };

function Chart({ points }: { readonly points: readonly Point[] }) {
  return (
    <ResponsiveContainer>
      <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={colors.gray200} vertical={false} />
        <XAxis dataKey="fecha" tickFormatter={dia} minTickGap={24} />
        <YAxis
          tickFormatter={(v) => formatMoneyCompact(BigInt(Math.round(Number(v))))}
          width={72}
        />
        <Tooltip formatter={money} labelFormatter={(l) => dia(String(l))} />
        <Legend />
        <Line
          type="monotone"
          dataKey="ventas"
          name="Ventas"
          stroke={colors.greenText}
          strokeWidth={2.5}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="gastos"
          name="Gastos"
          stroke={colors.redText}
          strokeWidth={2.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Ultimos30Dias({ serie }: { readonly serie: InicioData['serie'] }) {
  const points: Point[] = serie.map((d) => ({
    fecha: d.fecha,
    ventas: Number(d.ventas),
    gastos: Number(d.gastos),
  }));
  const ventas = serie.reduce((t, d) => t + d.ventas, 0n);
  const gastos = serie.reduce((t, d) => t + d.gastos, 0n);
  const resumen = `Últimos 30 días: ventas ${formatMoney(ventas)}, gastos ${formatMoney(gastos)}.`;
  return (
    <Card>
      <p style={{ margin: '0 0 12px' }}>{resumen}</p>
      <div role="img" aria-label={resumen} style={{ width: '100%', height: 260 }}>
        <Chart points={points} />
      </div>
    </Card>
  );
}
