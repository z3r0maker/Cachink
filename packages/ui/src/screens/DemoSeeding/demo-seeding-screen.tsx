/**
 * DemoSeedingScreen — full-screen branded loading overlay shown while
 * demo data is being seeded into the database.
 *
 * Renders at the `GatedNavigation` level so it persists across the
 * wizard → app transition (mode=null → mode='local' Zustand burst).
 *
 * Uses the project Spinner (rotating dollar sign) + a short status
 * message. Neobrutalist style per CLAUDE.md §8.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Spinner } from '../../components/Spinner/index';
import { colors, fontSizes, typography } from '../../theme';

export interface DemoSeedingScreenProps {
  readonly testID?: string;
}

export function DemoSeedingScreen(props: DemoSeedingScreenProps): ReactElement {
  return (
    <View
      testID={props.testID ?? 'demo-seeding-screen'}
      flex={1}
      backgroundColor={colors.offwhite}
      alignItems="center"
      justifyContent="center"
      gap={24}
      padding={32}
    >
      <Spinner size="xl" testID="demo-seeding-spinner" />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.xl}
        color={colors.ink}
        textAlign="center"
      >
        Preparando datos de demostración…
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.md}
        color={colors.gray600}
        textAlign="center"
      >
        Esto toma unos segundos.
      </Text>
    </View>
  );
}
