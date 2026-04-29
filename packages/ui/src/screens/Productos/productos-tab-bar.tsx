/**
 * ProductosTabBar — sub-tab toggle: Catálogo / Stock / Movimientos.
 *
 * Sub-tab visibility adapts to `Business.tipoNegocio` (ADR-045):
 *   - producto-con-stock / mixto → all three sub-tabs.
 *   - producto-sin-stock / servicio → only Catálogo.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { TipoNegocio } from '@cachink/domain';
import { SegmentedToggle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';

export type ProductosSubTab = 'catalogo' | 'stock' | 'movimientos';

export interface ProductosTabBarProps {
  readonly active: ProductosSubTab;
  readonly onChange: (next: ProductosSubTab) => void;
  readonly tipoNegocio: TipoNegocio;
  readonly testID?: string;
}

/** Determine which sub-tabs are visible based on business type. */
export function visibleSubTabs(tipoNegocio: TipoNegocio): readonly ProductosSubTab[] {
  const tracksStock = tipoNegocio === 'producto-con-stock' || tipoNegocio === 'mixto';
  return tracksStock ? ['catalogo', 'stock', 'movimientos'] : ['catalogo'];
}

export function ProductosTabBar(props: ProductosTabBarProps): ReactElement {
  const { t } = useTranslation();
  const tabs = visibleSubTabs(props.tipoNegocio);
  const options = tabs.map((key) => ({
    key,
    label: t(`productos.${key}Tab` as const),
  }));

  return (
    <View paddingHorizontal={16} paddingTop={12} backgroundColor={colors.offwhite}>
      <SegmentedToggle<ProductosSubTab>
        testID={props.testID ?? 'productos-tab-bar'}
        testIDPrefix="productos-tab"
        value={props.active}
        onChange={props.onChange}
        options={options}
      />
    </View>
  );
}
