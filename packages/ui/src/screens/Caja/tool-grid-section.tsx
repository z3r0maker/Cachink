/**
 * ToolGridSection — the Caja tool grid (Movimientos, Cancelaciones…).
 * Reuses `OtrosCard` and the `otros-<key>` testIDs so flows address the
 * cards the same way they always have. Moved here from Settings in A-12,
 * which no longer renders it.
 */

import type { ReactElement } from 'react';
import { useWindowDimensions } from 'react-native';
import { View } from '@tamagui/core';
import { SectionTitle } from '../../components/index';
import { OtrosCard } from './tool-card';
import type { OtrosItem } from './tool-items';

export interface ToolGridSectionProps {
  readonly items: readonly OtrosItem[];
  readonly onNavigate: (path: string) => void;
  readonly title: string;
}

export function ToolGridSection(props: ToolGridSectionProps): ReactElement | null {
  const { width } = useWindowDimensions();
  if (props.items.length === 0) return null;

  // Match OtrosScreen: 3 columns on tablet, 2 on phone. The Settings
  // ScrollView pads 20 on each side (vs 16 in OtrosScreen).
  const columns = width > 600 ? 3 : 2;
  const gap = 14;
  const cardWidth = (width - 20 * 2 - gap * (columns - 1)) / columns;

  return (
    <View gap={12} testID="settings-nav-section">
      <SectionTitle title={props.title} />
      <View flexDirection="row" flexWrap="wrap" gap={gap} alignItems="stretch">
        {props.items.map((item) => (
          <View key={item.key} width={cardWidth}>
            <OtrosCard
              item={item}
              onPress={() => props.onNavigate(item.path)}
              testID={`otros-${item.key}`}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
