/**
 * InventarioTabBar — two-segment toggle between Stock and Movimientos
 * inside the /inventario route (Slice 9.6 T08).
 *
 * Both app shells render `<InventarioTabBar active={tab} onChange={setTab} />`
 * above the active sub-screen. Migrated to `<SegmentedToggle>` as
 * part of audit M-1 PR 5.5 (audit 3.1) — the previous inline
 * `<TabButton>` rendered with `paddingY:8` (effective 30 pt tap
 * target) and used `pressStyle: { opacity: 0.7 }` instead of the
 * brand translate(2,2) press transform. The `<SegmentedToggle>`
 * primitive carries both fixes: 40-pt height + 4-pt hitSlop = 48-pt
 * effective tap target, and the canonical `pressStyle` from §8.3.
 *
 * E2E selectors (`inventario-tab-stock`, `inventario-tab-movimientos`,
 * `inventario-tab-bar`) are preserved via the new
 * `<SegmentedToggle testIDPrefix>` prop.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { SegmentedToggle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';

export type InventarioSubTab = 'stock' | 'movimientos';

export interface InventarioTabBarProps {
  readonly active: InventarioSubTab;
  readonly onChange: (next: InventarioSubTab) => void;
  readonly testID?: string;
}

export function InventarioTabBar(props: InventarioTabBarProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View paddingHorizontal={16} paddingTop={12} backgroundColor={colors.offwhite}>
      <SegmentedToggle<InventarioSubTab>
        testID={props.testID ?? 'inventario-tab-bar'}
        testIDPrefix="inventario-tab"
        value={props.active}
        onChange={props.onChange}
        options={[
          { key: 'stock', label: t('inventario.stockTab') },
          { key: 'movimientos', label: t('inventario.movimientosTab') },
        ]}
      />
    </View>
  );
}
