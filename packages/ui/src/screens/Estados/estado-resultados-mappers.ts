/**
 * Pure mapping functions for EstadoResultadosScreen chart data.
 * Extracted to keep the screen component under 200 lines.
 */

import { type EstadoDeResultados, type ExpenseCategory, type SaleCategory } from '@cachink/domain';
import { moneyToNumber, CHART_PALETTE } from '../../charts/chart-tokens';
import type { WaterfallItem } from '../../charts/WaterfallChart/index';
import type { DonutSlice } from '../../charts/DonutChart/index';
import type { EgresoPorCategoria } from '../../hooks/use-egresos-por-categoria';
import type { IngresoPorCategoria } from '../../hooks/use-ingresos-por-categoria';
import type { useTranslation } from '../../i18n/index';

type T = ReturnType<typeof useTranslation>['t'];

/**
 * Build waterfall data using short "Brief" labels so the chart
 * never needs to truncate (Issue 1 — UX audit).
 *
 * Includes Merma bar after Utilidad Bruta when merma > 0 (8 bars).
 */
function topItems(estado: EstadoDeResultados, t: T): WaterfallItem[] {
  return [
    { label: t('estados.resultadosIngresosBrief'), value: moneyToNumber(estado.ingresos), type: 'income' },
    { label: t('estados.resultadosCostoVentasBrief'), value: moneyToNumber(estado.costoDeVentas), type: 'expense' },
    { label: t('estados.resultadosUtilidadBrutaBrief'), value: moneyToNumber(estado.utilidadBruta), type: 'subtotal' },
    { label: t('estados.resultadosMermaBrief'), value: moneyToNumber(estado.merma), type: 'expense' },
  ];
}

function bottomItems(estado: EstadoDeResultados, t: T): WaterfallItem[] {
  return [
    { label: t('estados.resultadosGastosOperativosBrief'), value: moneyToNumber(estado.gastosOperativos), type: 'expense' },
    { label: t('estados.resultadosUtilidadOperativaBrief'), value: moneyToNumber(estado.utilidadOperativa), type: 'subtotal' },
    { label: t('estados.resultadosIsrBrief'), value: moneyToNumber(estado.isr), type: 'expense' },
    { label: t('estados.resultadosUtilidadNetaBrief'), value: moneyToNumber(estado.utilidadNeta), type: 'subtotal' },
  ];
}

export function toWaterfallData(estado: EstadoDeResultados, t: T): WaterfallItem[] {
  return [...topItems(estado, t), ...bottomItems(estado, t)];
}

/** Maps expense category names to their CHART_PALETTE index. */
const CATEGORY_INDEX: Record<ExpenseCategory, number> = {
  'Materia Prima': 0,
  Inventario: 1,
  Nómina: 2,
  Renta: 3,
  Publicidad: 4,
  Mantenimiento: 5,
  Servicios: 6,
  Logística: 7,
  Impuestos: 8,
  Otro: 9,
};

export function toDonutSlices(data: readonly EgresoPorCategoria[]): DonutSlice[] {
  return data.map((item) => ({
    label: item.categoria,
    value: moneyToNumber(item.total),
    color: CHART_PALETTE[CATEGORY_INDEX[item.categoria] ?? 9] as string,
  }));
}

/** Maps sale category names to their CHART_PALETTE index. */
const SALE_CATEGORY_INDEX: Record<SaleCategory, number> = {
  Producto: 0,
  Servicio: 1,
  Anticipo: 2,
  'Suscripción': 3,
  Otro: 4,
};

export function toIngresoDonutSlices(data: readonly IngresoPorCategoria[]): DonutSlice[] {
  return data.map((item) => ({
    label: item.categoria,
    value: moneyToNumber(item.total),
    color: CHART_PALETTE[SALE_CATEGORY_INDEX[item.categoria] ?? 4] as string,
  }));
}
