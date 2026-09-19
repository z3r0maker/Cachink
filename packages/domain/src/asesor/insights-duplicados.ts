/** The duplicate-gasto detector, split out to keep `insights.ts` under the ceiling. */

import type { GastoInsight, Insight, InsightRows } from './insights.js';
import { URGENCIA_BASE, diasEntre, fmt } from './insights.js';

/** 5 · Same concepto and monto twice within HORAS_DUPLICADO hours. */
const HORAS_DUPLICADO = 72;

export function gastosDuplicados(rows: InsightRows): readonly Insight[] {
  const recientes = rows.egresos
    .filter((e) => diasEntre(e.fecha, rows.hoy) <= 30)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const vistos = new Map<string, GastoInsight>();
  const out: Insight[] = [];
  for (const e of recientes) {
    const clave = `${e.concepto}|${e.monto}`;
    const previo = vistos.get(clave);
    if (previo !== undefined && diasEntre(previo.fecha, e.fecha) * 24 <= HORAS_DUPLICADO) {
      out.push({
        kind: 'gasto-duplicado',
        severity: 'critical',
        urgencia: URGENCIA_BASE['gasto-duplicado'],
        title: `¿Registraste «${e.concepto}» dos veces?`,
        body: `Hay dos gastos de ${fmt(e.monto)} con el mismo concepto a poco tiempo uno del otro. Si es un error, cancela uno en el teléfono para no inflar tus gastos.`,
        ctaLabel: 'Ver gastos',
        ctaHref: '/movimientos?tab=gastos',
        clave: `gasto-duplicado:${e.id}`,
        monto: e.monto,
      });
    } else {
      vistos.set(clave, e);
    }
  }
  return out;
}
