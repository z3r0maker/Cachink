/**
 * HealthIndicator — colored dot + plain-language verdict for a metric.
 *
 * Three tones: healthy (green), warning (yellow), critical (red).
 * Optionally shows the threshold range being used and a link to
 * configure thresholds in Settings.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, typography } from '../../theme';

export type HealthTone = 'healthy' | 'warning' | 'critical';

export interface HealthIndicatorProps {
  readonly tone: HealthTone;
  /** Plain-language verdict, e.g. "Tu margen es saludable". */
  readonly verdict: string;
  /** Optional: show the threshold range being used. */
  readonly thresholdLabel?: string;
  /** Route to Settings for threshold configuration. */
  readonly onOpenSettings?: () => void;
  readonly testID?: string;
}

const TONE_COLOR: Record<HealthTone, string> = {
  healthy: colors.green,
  warning: colors.warning,
  critical: colors.red,
};

export function HealthIndicator(props: HealthIndicatorProps): ReactElement {
  return (
    <View testID={props.testID ?? 'health-indicator'} gap={2}>
      <View flexDirection="row" alignItems="center" gap={6}>
        <View
          testID="health-indicator-dot"
          width={8}
          height={8}
          borderRadius={4}
          backgroundColor={TONE_COLOR[props.tone]}
        />
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={13}
          color={colors.ink}
          flex={1}
        >
          {props.verdict}
        </Text>
      </View>
      {props.thresholdLabel !== undefined && (
        <View
          flexDirection="row"
          alignItems="center"
          gap={4}
          paddingLeft={14}
        >
          <Text
            testID="health-indicator-threshold"
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.regular}
            fontSize={11}
            color={colors.gray400}
          >
            {props.thresholdLabel}
          </Text>
          {props.onOpenSettings !== undefined && (
            <Text
              testID="health-indicator-settings-link"
              fontFamily={typography.fontFamily}
              fontWeight={typography.weights.medium}
              fontSize={11}
              color={colors.blue}
              onPress={props.onOpenSettings}
              cursor="pointer"
            >
              Configurar en Ajustes →
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
