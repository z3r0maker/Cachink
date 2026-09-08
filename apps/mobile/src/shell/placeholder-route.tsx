/**
 * PlaceholderRoute — reusable "coming soon" screen for unbuilt features.
 *
 * Shows the feature name and a "Próximamente" message. Used by route
 * files for features that are feature-flagged but not yet implemented.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { SafeAreaSpacer, fontSizes } from '@cachink/ui';
import { useTranslation } from '@cachink/ui';

interface PlaceholderRouteProps {
  readonly featureLabel: string;
  readonly testID?: string;
}

export function PlaceholderRoute(props: PlaceholderRouteProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding={24}
      gap={16}
      testID={props.testID ?? 'placeholder-route'}
    >
      <SafeAreaSpacer />
      <Text fontWeight="900" fontSize={fontSizes.xl4} color="$color">
        {props.featureLabel}
      </Text>
      <Text fontSize={fontSizes.lg} color="$colorSubtle">
        {t('placeholder.subtitle')}
      </Text>
    </View>
  );
}
