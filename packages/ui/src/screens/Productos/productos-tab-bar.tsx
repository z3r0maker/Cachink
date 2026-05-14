/**
 * ProductosTabBar — sub-tab toggle: Catálogo / Stock / Movimientos.
 *
 * Sub-tab visibility now driven by the `stock` feature flag (Phase 5),
 * superseding the old `tipoNegocio` check.
 *   - stock ON  → all three sub-tabs.
 *   - stock OFF → only Catálogo.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { SegmentedToggle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';

export type ProductosSubTab = 'catalogo' | 'stock' | 'movimientos';

export interface ProductosTabBarProps {
  readonly active: ProductosSubTab;
  readonly onChange: (next: ProductosSubTab) => void;
  /** Feature flag: whether stock tracking is enabled. */
  readonly stockEnabled: boolean;
  readonly testID?: string;
}

/** Determine which sub-tabs are visible based on stock flag. */
export function visibleSubTabs(stockEnabled: boolean): readonly ProductosSubTab[] {
  return stockEnabled ? ['catalogo', 'stock', 'movimientos'] : ['catalogo'];
}

export function ProductosTabBar(props: ProductosTabBarProps): ReactElement {
  const { t } = useTranslation();
  const tabs = visibleSubTabs(props.stockEnabled);
  const options = tabs.map((key) => ({
    key,
    label: t(`productos.${key}Tab` as const),
  }));

  return (
    <View
      paddingHorizontal={12}
      paddingTop={12}
      paddingBottom={8}
      backgroundColor={colors.offwhite}
    >
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
