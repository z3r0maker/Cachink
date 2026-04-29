/**
 * StockBajoSummary — compact summary card for Director Home
 * (Slice 2 C21, Director Home prep).
 *
 * Smaller footprint than StockBajoBanner: designed to sit in a row of
 * Director Home cards. Shows "N productos con stock bajo" with a Ver
 * Btn linking to the Inventario tab with bajo-stock filter on.
 * Returns null when count is zero.
 *
 * Full Director Home integration lands in P1C-M10 \u2014 this file
 * ships the component so the integration is additive.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { ProductoConStock } from '../../hooks/use-productos-con-stock';
import { Btn, Card } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { countBajoStock } from './stock-bajo-banner';

export interface StockBajoSummaryProps {
  readonly items: readonly ProductoConStock[];
  readonly onVer?: () => void;
  readonly testID?: string;
}

function SummaryBody({
  count,
  onVer,
  t,
}: {
  count: number;
  onVer?: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" justifyContent="space-between" gap={12}>
      <View flex={1}>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={12}
          letterSpacing={typography.letterSpacing.wide}
          color={colors.gray600}
          style={{ textTransform: 'uppercase' }}
        >
          {t('inventario.bajoStockTitle')}
        </Text>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={28}
          color={colors.red}
          letterSpacing={typography.letterSpacing.tighter}
        >
          {count}
        </Text>
      </View>
      {onVer && (
        <Btn variant="soft" size="sm" onPress={onVer} testID="stock-bajo-summary-ver">
          {t('inventario.verBajoStock')}
        </Btn>
      )}
    </View>
  );
}

export function StockBajoSummary(props: StockBajoSummaryProps): ReactElement | null {
  const { t } = useTranslation();
  const count = countBajoStock(props.items);
  if (count === 0) return null;
  return (
    <Card testID={props.testID ?? 'stock-bajo-summary'} padding="md" fullWidth>
      <SummaryBody count={count} onVer={props.onVer} t={t} />
    </Card>
  );
}
