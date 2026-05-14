/**
 * Pure mapping functions for EstadoResultadosScreen chart data.
 * Extracted to keep the screen component under 200 lines.
 */

import type { EstadoDeResultados, ExpenseCategory } from '@cachink/domain';
import { moneyToNumber, CHART_PALETTE } from '../../charts/chart-tokens';
import type { WaterfallItem } from '../../charts/WaterfallChart/index';
import type { DonutSlice } from '../../charts/DonutChart/index';
import type { EgresoPorCategoria } from '../../hooks/use-egresos-por-categoria';
import type { useTranslation } from '../../i18n/index';

type T = ReturnType<typeof useTranslation>['t'];

export function toWaterfallData(estado: EstadoDeResultados, t: T): WaterfallItem[] {
  return [
    {
      label: t('estados.resultadosIngresos'),
      value: moneyToNumber(estado.ingresos),
      type: 'income',
    },
    {
      label: t('estados.resultadosCostoVentas'),
      value: moneyToNumber(estado.costoDeVentas),
      type: 'expense',
    },
    {
      label: t('estados.resultadosUtilidadBruta'),
      value: moneyToNumber(estado.utilidadBruta),
      type: 'subtotal',
    },
    {
      label: t('estados.resultadosGastosOperativos'),
      value: moneyToNumber(estado.gastosOperativos),
      type: 'expense',
    },
    {
      label: t('estados.resultadosUtilidadOperativa'),
      value: moneyToNumber(estado.utilidadOperativa),
      type: 'subtotal',
    },
    { label: t('estados.resultadosIsr'), value: moneyToNumber(estado.isr), type: 'expense' },
    {
      label: t('estados.resultadosUtilidadNeta'),
      value: moneyToNumber(estado.utilidadNeta),
      type: 'subtotal',
    },
  ];
}

/** Maps category names to their CHART_PALETTE index. */
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
