/**
 * AppLoadingSkeleton — generic full-screen skeleton shown during auth-gate
 * transitions (e.g. while useAuthGateState queries users).
 *
 * Replaces the previous `return null` in `AuthInner` which produced a
 * blank screen with only the settings cog visible.
 *
 * Matches the AppShell layout: a top bar placeholder + content skeleton rows
 * so the user perceives continuity rather than a flash of nothing.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Spinner } from '../components/Spinner/index';
import { colors, fontSizes, typography } from '../theme';

export interface AppLoadingSkeletonProps {
  readonly testID?: string;
}

export function AppLoadingSkeleton(props: AppLoadingSkeletonProps): ReactElement {
  return (
    <View
      testID={props.testID ?? 'app-loading-skeleton'}
      flex={1}
      backgroundColor={colors.offwhite}
      alignItems="center"
      justifyContent="center"
      gap={24}
      padding={32}
    >
      <Spinner size="xl" testID="app-loading-spinner" />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.lg}
        color={colors.gray600}
        textAlign="center"
      >
        Espera un momento…
      </Text>
    </View>
  );
}
