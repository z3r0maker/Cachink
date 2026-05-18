/**
 * NotificationToggleCard — single toggle row for the Config tab.
 *
 * Shows source icon + label + description + Switch. When the parent
 * feature flag is OFF, the switch is disabled with an italic hint.
 *
 * Phase 11 — Director Notification Inbox.
 */

import type { ReactElement } from 'react';
import { Switch, Platform } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { AlertSeverity } from '@cachink/domain';
import { Card, Icon } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import type { NotificationSourceInfo } from './notification-source-info';

function severityDotColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return colors.red;
    case 'warning':
      return colors.warning;
    case 'info':
      return colors.blue;
    default:
      return colors.blue;
  }
}

export interface NotificationToggleCardProps {
  readonly info: NotificationSourceInfo;
  readonly enabled: boolean;
  readonly locked: boolean;
  readonly lockedHint?: string | null;
  readonly onToggle: (newValue: boolean) => void;
  readonly testID?: string;
}

function ToggleLabelRow({
  info,
  locked,
}: {
  info: NotificationSourceInfo;
  locked: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const labelColor = locked ? colors.gray400 : colors.black;
  const dotColor = locked ? colors.gray200 : severityDotColor(info.defaultSeverity);
  return (
    <View flexDirection="row" alignItems="center" gap={8}>
      <View width={8} height={8} borderRadius={4} backgroundColor={dotColor} />
      <Icon name={info.icon} size={18} color={labelColor} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={15}
        color={labelColor}
      >
        {t(info.labelKey as never)}
      </Text>
    </View>
  );
}

function ToggleLabelColumn({
  info,
  locked,
  lockedHint,
}: {
  info: NotificationSourceInfo;
  locked: boolean;
  lockedHint?: string | null;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <View flex={1} marginRight={12} gap={4}>
      <ToggleLabelRow info={info} locked={locked} />
      <Text fontFamily={typography.fontFamily} fontSize={13} color={colors.gray600}>
        {t(info.descriptionKey as never)}
      </Text>
      {locked && lockedHint && (
        <Text
          fontFamily={typography.fontFamily}
          fontSize={12}
          color={colors.gray400}
          fontStyle="italic"
        >
          {lockedHint}
        </Text>
      )}
    </View>
  );
}

export function NotificationToggleCard(props: NotificationToggleCardProps): ReactElement {
  const { info, enabled, locked, lockedHint, onToggle, testID } = props;
  const tid = testID ?? `notif-toggle-${info.source}`;
  return (
    <Card testID={tid} variant="white" padding="md" fullWidth>
      <View flexDirection="row" alignItems="center" justifyContent="space-between">
        <ToggleLabelColumn info={info} locked={locked} lockedHint={lockedHint} />
        <Switch
          value={enabled}
          onValueChange={onToggle}
          disabled={locked}
          trackColor={{ false: colors.gray200, true: colors.yellow }}
          thumbColor={Platform.OS === 'android' ? colors.white : undefined}
          ios_backgroundColor={colors.gray200}
          testID={`${tid}-switch`}
        />
      </View>
    </Card>
  );
}
