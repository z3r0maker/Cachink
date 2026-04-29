/**
 * FrecuentesGrid — quick-sell grid showing the 6 most-sold products.
 *
 * Wraps `<ProductoCardGrid mode="sell">` with a section title. When no
 * productos exist, renders nothing (the manual form handles cold start).
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { Product } from '@cachink/domain';
import { ProductoCardGrid, SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';

export interface FrecuentesGridProps {
  readonly productos: readonly Product[];
  readonly stockMap?: ReadonlyMap<string, number>;
  readonly onTap: (p: Product) => void;
  readonly testID?: string;
}

export function FrecuentesGrid(props: FrecuentesGridProps): ReactElement | null {
  const { t } = useTranslation();
  if (props.productos.length === 0) return null;
  return (
    <View testID={props.testID ?? 'frecuentes-grid'} gap={8}>
      <View paddingHorizontal={16}>
        <SectionTitle title={t('ventas.frecuentes')} />
      </View>
      <ProductoCardGrid
        productos={props.productos}
        stockMap={props.stockMap}
        mode="sell"
        onPress={props.onTap}
      />
    </View>
  );
}
