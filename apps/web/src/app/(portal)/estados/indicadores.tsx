import {
  DEFAULT_HEALTH_THRESHOLDS,
  evaluateHealth,
  type HealthTone,
  type Indicadores as IndicadoresShape,
} from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Card } from '@/components';

import { GaugeSvg } from './gauge';
import {
  gaugeCifra,
  gaugeGrid,
  gaugePunto,
  gaugeRotulo,
  gaugeSubtitulo,
  gaugeVeredicto,
} from './charts.css';

/**
 * Indicadores, as the design draws them (C-13): a dial per margin, then the
 * ratios that have no natural ceiling as plain cards.
 *
 * The bands come from the domain's `DEFAULT_HEALTH_THRESHOLDS` — the same
 * numbers `evaluateHealth` judges by, so the needle can never sit in a green
 * band under a «Crítico» verdict. Only `max`, the dial's ceiling, is the
 * design's own choice: it is a drawing decision, not a rule.
 */
const CEILING = { margenBruto: 0.5, margenOperativo: 0.3, margenNeto: 0.24 } as const;

const VEREDICTO: Record<
  HealthTone,
  { readonly texto: string; readonly tinta: string; readonly punto: string }
> = {
  healthy: { texto: 'Saludable.', tinta: colors.greenText, punto: colors.green },
  warning: {
    texto: 'Bajo — vale la pena revisarlo.',
    tinta: colors.warningText,
    punto: colors.warning,
  },
  critical: { texto: 'Crítico — atiéndelo pronto.', tinta: colors.redText, punto: colors.red },
};

const pct = (v: number | null): string => (v === null ? '—' : `${(v * 100).toFixed(1)}%`);

interface Dial {
  readonly label: string;
  readonly valor: number | null;
  readonly lo: number;
  readonly hi: number;
  readonly max: number;
  readonly subtitulo: string;
}

function dials(ind: IndicadoresShape): readonly Dial[] {
  const t = DEFAULT_HEALTH_THRESHOLDS;
  return [
    {
      label: 'Margen bruto',
      valor: ind.margenBruto,
      lo: t.margenBruto.warning,
      hi: t.margenBruto.healthy,
      max: CEILING.margenBruto,
      subtitulo: 'De cada peso vendido, ¿cuánto te queda después del costo?',
    },
    {
      label: 'Margen operativo',
      valor: ind.margenOperativo,
      lo: t.margenOperativo.warning,
      hi: t.margenOperativo.healthy,
      max: CEILING.margenOperativo,
      subtitulo: 'De cada peso vendido, ¿cuánto queda después de TODOS los gastos?',
    },
    {
      label: 'Margen neto',
      valor: ind.margenNeto,
      lo: t.margenNeto.warning,
      hi: t.margenNeto.healthy,
      max: CEILING.margenNeto,
      subtitulo: 'Tu ganancia real por cada peso vendido',
    },
  ];
}

function Veredicto({ tone }: { readonly tone: HealthTone }) {
  const v = VEREDICTO[tone];
  return (
    <div className={gaugeVeredicto} style={{ color: v.tinta }}>
      <span className={gaugePunto} style={{ background: v.punto }} aria-hidden="true" />
      {v.texto}
    </div>
  );
}

function DialCard({ d }: { readonly d: Dial }) {
  const tone = evaluateHealth(d.valor, { warning: d.lo, healthy: d.hi });
  return (
    <Card>
      <div className={gaugeRotulo}>{d.label}</div>
      {/* A metric with no denominator has no needle to draw — the figure says «—». */}
      {d.valor === null ? null : <GaugeSvg valor={d.valor} lo={d.lo} hi={d.hi} max={d.max} />}
      <div className={gaugeCifra}>{pct(d.valor)}</div>
      {tone === null ? null : <Veredicto tone={tone} />}
      <p className={gaugeSubtitulo}>{d.subtitulo}</p>
    </Card>
  );
}

interface Razon {
  readonly label: string;
  readonly valor: string;
  readonly tone: HealthTone | null;
  readonly subtitulo: string;
}

function razones(ind: IndicadoresShape): readonly Razon[] {
  const t = DEFAULT_HEALTH_THRESHOLDS;
  return [
    {
      label: 'Razón de liquidez',
      valor: ind.razonDeLiquidez === null ? '—' : `${ind.razonDeLiquidez.toFixed(2)}×`,
      tone: evaluateHealth(ind.razonDeLiquidez, t.razonDeLiquidez),
      subtitulo: '¿Puedes pagar lo que debes con lo que tienes?',
    },
    {
      label: 'Rotación de inventario',
      valor:
        ind.rotacionInventario === null ? '—' : `${ind.rotacionInventario.toFixed(2)} veces/mes`,
      tone: evaluateHealth(ind.rotacionInventario, t.rotacionInventario),
      subtitulo: '¿Cuántas veces renovaste tu inventario?',
    },
    {
      label: 'Días promedio de cobranza',
      valor:
        ind.diasPromedioCobranza === null ? '—' : `${Math.round(ind.diasPromedioCobranza)} días`,
      // Fewer days is better here, which is what `invertedScale` is for.
      tone: evaluateHealth(ind.diasPromedioCobranza, t.diasPromedioCobranza, true),
      subtitulo: '¿Cuántos días tardan tus clientes en pagarte?',
    },
  ];
}

function RazonCard({ r }: { readonly r: Razon }) {
  return (
    <Card>
      <div className={gaugeRotulo}>{r.label}</div>
      <div className={gaugeCifra} style={{ marginTop: 10 }}>
        {r.valor}
      </div>
      {r.tone === null ? null : <Veredicto tone={r.tone} />}
      <p className={gaugeSubtitulo}>{r.subtitulo}</p>
    </Card>
  );
}

export function Indicadores({ indicadores }: { readonly indicadores: IndicadoresShape }) {
  return (
    <>
      <div className={gaugeGrid}>
        {dials(indicadores).map((d) => (
          <DialCard key={d.label} d={d} />
        ))}
      </div>
      <div className={gaugeGrid}>
        {razones(indicadores).map((r) => (
          <RazonCard key={r.label} r={r} />
        ))}
      </div>
    </>
  );
}
