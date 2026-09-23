'use client';

import { formatMoney } from '@xangarro/domain';

import { KpiCard, kpiGrid } from '@/components';

import { kpisDeGastos, kpisDeVentas } from './kpis';
import type { Row } from './parts';

/**
 * The KPI row the screen had none of (B-1).
 *
 * Four tiles for Ventas, three for Gastos. The design's fourth gasto tile is
 * «Sin factura», which needs an invoice flag `expenses` does not carry — and
 * a tile nobody can compute is worse than a tile that is not there. Its two
 * missing Ventas tiles, «Efectivo en caja» and «Cuentas por cobrar», are the
 * cash position and the open balance: both are other screens' numbers, so
 * these say what this table can answer for instead.
 */
export function KpisVentas({ rows }: { readonly rows: readonly Row[] }) {
  const k = kpisDeVentas(rows);
  return (
    <div className={kpiGrid}>
      <KpiCard
        label="Ventas del periodo"
        value={formatMoney(k.total)}
        tone="positive"
        hint="Sin contar las canceladas"
      />
      <KpiCard
        label="Ticket promedio"
        value={k.ticketPromedio === null ? '—' : formatMoney(k.ticketPromedio)}
        hint="Por venta, no por producto"
      />
      <KpiCard label="Cobrado de contado" value={formatMoney(k.contado)} hint="Ya está en caja" />
      <KpiCard
        label="Vendido a crédito"
        value={formatMoney(k.credito)}
        tone="warning"
        hint="Todavía te lo deben"
      />
    </div>
  );
}

export function KpisGastos({ rows }: { readonly rows: readonly Row[] }) {
  const k = kpisDeGastos(rows);
  return (
    <div className={kpiGrid}>
      <KpiCard
        label="Gastos del periodo"
        value={formatMoney(k.total)}
        tone="negative"
        hint="Todo lo que salió"
      />
      <KpiCard
        label="Mayor categoría"
        value={k.mayor === null ? '—' : formatMoney(k.mayor.monto)}
        hint={
          k.mayor === null
            ? 'Sin gastos en el periodo'
            : `${k.mayor.nombre} · ${Math.round(k.mayor.parte * 100)}%`
        }
      />
      <KpiCard label="Nómina" value={formatMoney(k.nomina)} hint="Lo que pagaste a tu gente" />
    </div>
  );
}
