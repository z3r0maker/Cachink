/**
 * The two month-shaped detectors, split out only to keep `insights.ts` under
 * the §2.6 file ceiling: quincena concentration and category anomalies.
 */

import type { Money } from '../money/index.js';

import type { Insight, InsightRows } from './insights.js';
import { URGENCIA_BASE, day, fmt, mesAnterior, nombreMes, ym } from './insights.js';

/** 2 · One half of the month concentrates ≥ MITAD_SKEW of the ventas. */
const MITAD_SKEW_PCT = 65;

export function gastosPorMitadDeMes(rows: InsightRows): readonly Insight[] {
  const mes = mesAnterior(rows.hoy, 1);
  const delMes = rows.ventas.filter((v) => ym(v.fecha) === mes);
  const primera = delMes.filter((v) => day(v.fecha) <= 15);
  const total = delMes.reduce((a, v) => a + v.monto, 0n);
  if (total === 0n) return [];
  const enPrimera = primera.reduce((a, v) => a + v.monto, 0n);
  const pctPrimera = Number((enPrimera * 100n) / total);
  const concentrada =
    pctPrimera >= MITAD_SKEW_PCT
      ? 'primera'
      : pctPrimera <= 100 - MITAD_SKEW_PCT
        ? 'segunda'
        : null;
  if (concentrada === null) return [];
  const pct = concentrada === 'primera' ? pctPrimera : 100 - pctPrimera;
  return [
    {
      kind: 'quincena',
      severity: 'info',
      urgencia: URGENCIA_BASE.quincena,
      title: `Tus ventas de ${nombreMes(mes)} se concentran en la ${concentrada} quincena`,
      body: `El ${pct}% del mes cayó en esa mitad. Ajusta tus compras y tu personal a esos días para no gastar de más en la quincena baja.`,
      ctaLabel: 'Ver movimientos',
      ctaHref: '/movimientos',
      clave: `quincena:${mes}`,
    },
  ];
}

/**
 * 3 · A category this month is ≥ GASTO_ANOMALO above its three-month average.
 *
 * **Both sides are monthly totals.** The baseline sums each prior month and
 * averages those sums, because the figure it is compared against is this
 * month's total. Averaging the individual egreso rows instead makes the
 * comparison dimensional nonsense — a category logged twice a month reads as
 * «100% arriba» on perfectly flat spending, and ten times a month as «900%
 * arriba», every month, for ever. `MESES_BASE` is months for the same reason:
 * three rows inside one April is one month of history, and the body says «en
 * los últimos tres».
 */
const GASTO_ANOMALO_PCT = 30;
const MESES_BASE = 3;

export function gastosFueraDeLoNormal(rows: InsightRows): readonly Insight[] {
  const mesActual = ym(rows.hoy);
  const actuales = new Map<string, Money>();
  /** categoría → mes → total de ese mes. */
  const base = new Map<string, Map<string, Money>>();
  for (const e of rows.egresos) {
    const m = ym(e.fecha);
    if (m === mesActual) {
      actuales.set(e.categoria, (actuales.get(e.categoria) ?? 0n) + e.monto);
      continue;
    }
    const meses = base.get(e.categoria) ?? new Map<string, Money>();
    meses.set(m, (meses.get(m) ?? 0n) + e.monto);
    base.set(e.categoria, meses);
  }
  const out: Insight[] = [];
  for (const [categoria, monto] of actuales) {
    const meses = [...(base.get(categoria)?.values() ?? [])];
    if (meses.length < MESES_BASE) continue;
    const promedio = meses.reduce((a, b) => a + b, 0n) / BigInt(meses.length);
    if (promedio === 0n) continue;
    const exceso = Number(((monto - promedio) * 100n) / promedio);
    if (exceso < GASTO_ANOMALO_PCT) continue;
    out.push({
      kind: 'gasto-fuera',
      severity: 'warning',
      urgencia: URGENCIA_BASE['gasto-fuera'] + exceso,
      title: `Tus gastos de ${categoria.toLowerCase()} van ${exceso}% arriba`,
      body: `Llevas ${fmt(monto)} este mes contra un promedio de ${fmt(promedio)} en los últimos tres. Si no es un gasto planeado, conviene revisarlo.`,
      ctaLabel: 'Ver gastos',
      ctaHref: '/movimientos?tab=gastos',
      clave: `gasto-fuera:${categoria}:${mesActual}`,
      monto: monto - promedio,
    });
  }
  return out;
}
