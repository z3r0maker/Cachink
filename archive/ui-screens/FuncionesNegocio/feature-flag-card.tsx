/**
 * FeatureFlagCard — single flag toggle card for the Funciones screen.
 */

import type { ReactElement } from 'react';
import { Switch, Platform } from 'react-native';
import { Text, View } from '@tamagui/core';
import { Card } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';
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

/** Italic note naming the flag this one depends on. Renders nothing without one. */
function DependencyHint({ hint }: { hint: string | null }): ReactElement | null {
  if (hint === null) return null;
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontSize={fontSizes.xs}
      color={colors.textMuted}
      marginTop={4}
      fontStyle="italic"
    >
      {hint}
    </Text>
  );
}

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
        fontSize={fontSizes.lg}
        color={colors.black}
      >
        {t(info.labelKey as never)}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontSize={fontSizes.sm}
        color={colors.gray600}
        marginTop={4}
      >
        {t(info.descriptionKey as never)}
      </Text>
      <DependencyHint hint={dependencyHint} />
    </View>
  );
}

function ComingSoonBadge({ t }: { t: T }): ReactElement {
  return (
    <View
      backgroundColor={colors.gray200}
      borderRadius={12}
      paddingHorizontal={10}
      paddingVertical={3}
    >
      <Text fontSize={fontSizes.xs} color={colors.gray600} fontFamily={typography.fontFamily}>
        {t('funciones.comingSoon')}
      </Text>
    </View>
  );
}

export function FeatureFlagCard(props: FeatureFlagCardProps): ReactElement {
  const { t } = useTranslation();
  const isComingSoon = props.info.comingSoon === true;
  return (
    <Card testID={props.testID} variant="white" padding="md" fullWidth>
      <View flexDirection="row" alignItems="center" justifyContent="space-between">
        <FlagCardText info={props.info} dependencyHint={props.dependencyHint} t={t} />
        {isComingSoon ? (
          <ComingSoonBadge t={t} />
        ) : (
          <Switch
            value={props.enabled}
            onValueChange={props.onToggle}
            disabled={!props.canToggle}
            trackColor={{ false: colors.gray200, true: colors.yellow }}
            thumbColor={Platform.OS === 'android' ? colors.white : undefined}
            ios_backgroundColor={colors.gray200}
            testID={`${props.testID}-switch`}
          />
        )}
      </View>
    </Card>
  );
}
