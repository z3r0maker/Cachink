/**
 * SettingsSection + SettingsRow — the shared layout pieces of the device
 * Settings screen (A-12): an uppercase section title over a card of rows.
 */

import type { ReactElement, ReactNode } from 'react';
import { Text, View } from '@tamagui/core';
import { Card } from '../../components/index';
import { colors, fontSizes, typography } from '../../theme';

export function SettingsSection(props: {
  readonly title: string;
  readonly children: ReactNode;
  readonly testID?: string;
}): ReactElement {
  return (
    <View gap={8} testID={props.testID}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.xs}
        letterSpacing={typography.letterSpacing.wide}
        color={colors.gray600}
        style={{ textTransform: 'uppercase' }}
      >
        {props.title}
      </Text>
      <Card padding="md" fullWidth>
        <View gap={12}>{props.children}</View>
      </Card>
    </View>
  );
}

export function SettingsRow(props: {
  readonly label: string;
  readonly value: string;
  readonly testID?: string;
}): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-between" alignItems="center" gap={12}>
      <Text fontFamily={typography.fontFamily} fontSize={fontSizes.md} color={colors.gray600}>
        {props.label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={fontSizes.md}
        color={colors.black}
        testID={props.testID}
        flexShrink={1}
        textAlign="right"
      >
        {props.value}
      </Text>
    </View>
  );
}

export function SettingsNote(props: { readonly text: string; readonly testID?: string }) {
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontSize={fontSizes.sm}
      color={colors.gray600}
      testID={props.testID}
    >
      {props.text}
    </Text>
  );
}
