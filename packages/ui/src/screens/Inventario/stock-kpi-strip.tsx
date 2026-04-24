/**
 * StockKpiStrip — 3-up Kpi strip sitting at the top of the Stock
 * screen (Slice 2 C12).
 *
 * Uses the Kpi primitive inside Card wrappers per the established
 * CLAUDE.md §8 composition pattern (Card owns surface, Kpi owns
 * typography).
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoneyCompact } from '@cachink/domain';
import type { InventarioKpis } from '../../hooks/use-inventario-kpis';
import { Card, Kpi } from '../../components/index';
import { useTranslation } from '../../i18n/index';

export interface StockKpiStripProps {
  readonly kpis: InventarioKpis;
  readonly testID?: string;
}

export function StockKpiStrip(props: StockKpiStripProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View testID={props.testID ?? 'stock-kpi-strip'} flexDirection="row" gap={8}>
      <Card padding="md" fullWidth testID="stock-kpi-productos">
        <Kpi label={t('inventario.kpiTotalProductos')} value={String(props.kpis.totalProductos)} />
      </Card>
      <Card padding="md" fullWidth testID="stock-kpi-valor">
        <Kpi
          label={t('inventario.kpiValor')}
          value={formatMoneyCompact(props.kpis.valorInventario)}
        />
      </Card>
      <Card padding="md" fullWidth testID="stock-kpi-bajo">
        <Kpi
          label={t('inventario.kpiBajoStock')}
          value={String(props.kpis.bajoStockCount)}
          tone={props.kpis.bajoStockCount > 0 ? 'negative' : 'neutral'}
        />
      </Card>
    </View>
  );
}
