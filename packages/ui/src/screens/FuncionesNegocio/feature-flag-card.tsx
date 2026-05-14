/**
 * FeatureFlagCard — single flag toggle card for the Funciones screen.
 */

import type { ReactElement } from 'react';
import { Switch } from 'react-native';
import { Text, View } from '@tamagui/core';
import { Card } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import type { FlagDisplayInfo } from './flag-descriptions';

export interface FeatureFlagCardProps {
  readonly info: FlagDisplayInfo;
  readonly enabled: boolean;
  readonly canToggle: boolean;
  readonly dependencyHint: string | null;
  readonly onToggle: (newValue: boolean) => void;
  readonly testID: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function FlagCardText({
  info,
  dependencyHint,
  t,
}: {
  info: FlagDisplayInfo;
  dependencyHint: string | null;
  t: T;
}): ReactElement {
  return (
    <View flex={1} marginRight={12}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={16}
        color={colors.black}
      >
        {t(info.labelKey as never)}
      </Text>
      <Text fontFamily={typography.fontFamily} fontSize={13} color={colors.gray600} marginTop={4}>
        {t(info.descriptionKey as never)}
      </Text>
      {dependencyHint !== null && (
        <Text
          fontFamily={typography.fontFamily}
          fontSize={12}
          color={colors.gray400}
          marginTop={4}
          fontStyle="italic"
        >
          {dependencyHint}
        </Text>
      )}
    </View>
  );
}

export function FeatureFlagCard(props: FeatureFlagCardProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Card testID={props.testID} variant="white" padding="md" fullWidth>
      <View flexDirection="row" alignItems="center" justifyContent="space-between">
        <FlagCardText info={props.info} dependencyHint={props.dependencyHint} t={t} />
        <Switch
          value={props.enabled}
          onValueChange={props.onToggle}
          disabled={!props.canToggle}
          testID={`${props.testID}-switch`}
        />
      </View>
    </Card>
  );
}
