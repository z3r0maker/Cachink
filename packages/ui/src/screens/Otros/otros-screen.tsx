/**
 * OtrosScreen — grid of feature-flagged shortcuts.
 *
 * The 4th tab for both roles. Shows a responsive grid of cards
 * linking to feature-specific screens. Items are filtered by the
 * active feature flags and the user's role.
 *
 * Phase 4 of the Feature Flags plan.
 */

import type { ReactElement } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { FeatureFlags } from '@cachink/domain';
import { SafeAreaSpacer } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { operativoOtrosItems, directorOtrosItems } from './otros-items';
import { OtrosCard } from './otros-card';

export interface OtrosScreenProps {
  readonly role: 'operativo' | 'director';
  readonly flags: FeatureFlags;
  readonly onNavigate: (path: string) => void;
  readonly testID?: string;
}

export function OtrosScreen(props: OtrosScreenProps): ReactElement {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const items =
    props.role === 'director' ? directorOtrosItems(props.flags) : operativoOtrosItems(props.flags);

  // Responsive: 3 columns on tablet (>600), 2 on phone
  const columns = width > 600 ? 3 : 2;
  const gap = 12;
  const padding = 16;
  const cardWidth = (width - padding * 2 - gap * (columns - 1)) / columns;

  return (
    <ScrollView testID={props.testID ?? 'otros-screen'} contentContainerStyle={{ padding, gap }}>
      <SafeAreaSpacer />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={28}
        color={colors.black}
        marginBottom={8}
      >
        {t('tabs.otros')}
      </Text>
      <View flexDirection="row" flexWrap="wrap" gap={gap}>
        {items.map((item) => (
          <View key={item.key} width={cardWidth}>
            <OtrosCard
              item={item}
              onPress={() => props.onNavigate(item.path)}
              testID={`otros-${item.key}`}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
