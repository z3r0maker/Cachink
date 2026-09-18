'use client';

import {
  DEFAULT_HEALTH_THRESHOLDS,
  evaluateHealth,
  formatMoney,
  type Indicadores as IndicadoresShape,
  type Money,
} from '@xangarro/domain';

import { Card, KpiCard, Verdict, kpiGrid } from '@/components';
import { eyebrow } from '@/styles/text.css';

import { isrNotice, summaryFigure } from './estados.css';

export function Resumen({
  headline,
  figure,
  label,
}: {
  readonly headline: string;
  readonly figure: Money;
  readonly label: string;
}) {
  const positive = figure > 0n;
  return (
    <Card tone={positive ? 'success' : 'danger'}>
      <span className={eyebrow}>Resumen del periodo</span>
      <p style={{ margin: '10px 0 0', fontWeight: 700 }}>{headline}</p>
      <p className={summaryFigure}>{formatMoney(figure)}</p>
      <span className={eyebrow}>{label}</span>
      <div>
        <Verdict tone={positive ? 'healthy' : 'critical'}>
          {positive
            ? 'Tu negocio fue rentable este periodo.'
            : 'Tu negocio operó a pérdida este periodo.'}
        </Verdict>
      </div>
    </Card>
  );
}

/** This disclaimer must survive into production (design handoff, ADR-058). */
export function IsrNotice() {
  return (
    <div className={isrNotice}>
      <div>
        <strong>ISR referencial (1.25%)</strong>
        <p style={{ margin: '6px 0 0', fontWeight: 600 }}>
          La cifra de ISR es orientativa. Consulta a tu contador antes de declarar.
        </p>
      </div>
    </div>
  );
}

const pct = (v: number | null): string => (v === null ? '—' : `${Math.round(v * 100)}%`);

/**
 * Margins and efficiency, with the health verdict computed by the domain's
 * `evaluateHealth` against `DEFAULT_HEALTH_THRESHOLDS` — not by bands retyped
 * into the portal.
 */
export function Indicadores({ indicadores }: { readonly indicadores: IndicadoresShape }) {
  const t = DEFAULT_HEALTH_THRESHOLDS;
  const rows = [
    {
      label: 'Margen bruto',
      value: pct(indicadores.margenBruto),
      hint: 'De cada peso vendido, ¿cuánto te queda después del costo?',
      tone: evaluateHealth(indicadores.margenBruto, t.margenBruto),
    },
    {
      label: 'Margen operativo',
      value: pct(indicadores.margenOperativo),
      hint: 'De cada peso vendido, ¿cuánto queda después de TODOS los gastos?',
      tone: evaluateHealth(indicadores.margenOperativo, t.margenOperativo),
    },
    {
      label: 'Margen neto',
      value: pct(indicadores.margenNeto),
      hint: 'Tu ganancia real por cada peso vendido',
      tone: evaluateHealth(indicadores.margenNeto, t.margenNeto),
    },
    {
      label: 'Razón de liquidez',
      value:
        indicadores.razonDeLiquidez === null ? '—' : `${indicadores.razonDeLiquidez.toFixed(2)}×`,
      hint: '¿Puedes pagar lo que debes con lo que tienes?',
      tone: evaluateHealth(indicadores.razonDeLiquidez, t.razonDeLiquidez),
    },
  ];

  return (
    <div className={kpiGrid}>
      {rows.map((r) => (
        <KpiCard key={r.label} label={r.label} value={r.value} hint={r.hint}>
          {r.tone ? <Verdict tone={r.tone}>{VERDICT[r.tone]}</Verdict> : null}
        </KpiCard>
      ))}
    </div>
  );
}

const VERDICT = {
  healthy: 'Saludable.',
  warning: 'Bajo — vale la pena revisarlo.',
  critical: 'Crítico — atiéndelo pronto.',
} as const;
