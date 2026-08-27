/**
 * SettingsNavSection — the Director's tool grid, rendered inside
 * Configuración (review item #7).
 *
 * The Director bottom bar used to end in "Otros", a label that told
 * the user nothing and cost a tab slot that Gastos needed. The grid
 * itself was fine — it just belonged behind the top-bar cog rather
 * than in the four-slot bar.
 *
 * This reuses `OtrosCard` and the `otros-<key>` testIDs verbatim, so
 * the cards look and address identically wherever they render; only
 * the path the user takes to reach them changed.
 */

import type { ReactElement } from 'react';
import { useWindowDimensions } from 'react-native';
import { View } from '@tamagui/core';
import { SectionTitle } from '../../components/index';
import { OtrosCard } from '../Otros/otros-card';
import type { OtrosItem } from '../Otros/otros-items';

export interface SettingsNavSectionProps {
  readonly items: readonly OtrosItem[];
  readonly onNavigate: (path: string) => void;
  readonly title: string;
}

export function SettingsNavSection(props: SettingsNavSectionProps): ReactElement | null {
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
