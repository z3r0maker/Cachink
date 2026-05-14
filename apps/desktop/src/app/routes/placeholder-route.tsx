/**
 * Desktop PlaceholderRoute — "coming soon" screen for unbuilt features.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { useTranslation } from '@cachink/ui';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';

interface DesktopPlaceholderRouteProps {
  readonly activeTabKey: string;
  readonly featureLabel: string;
  readonly testID?: string;
}

export function DesktopPlaceholderRoute(
  props: DesktopPlaceholderRouteProps,
): ReactElement {
  const { t } = useTranslation();
  return (
    <DesktopAppShellWrapper activeTabKey={props.activeTabKey}>
      <View
        flex={1}
        alignItems="center"
        justifyContent="center"
        padding={24}
        gap={16}
        testID={props.testID ?? 'desktop-placeholder-route'}
      >
        <Text fontWeight="900" fontSize={28} color="$color">
          {props.featureLabel}
        </Text>
        <Text fontSize={16} color="$colorSubtle">
          {t('placeholder.subtitle')}
        </Text>
      </View>
    </DesktopAppShellWrapper>
  );
}
