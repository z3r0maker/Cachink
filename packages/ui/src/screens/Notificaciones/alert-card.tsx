/**
 * AlertCard — single notification item in the Notificaciones list.
 *
 * Displays severity icon, title, message, relative timestamp, and
 * a "Ver" action. Unread cards have a colored left border accent.
 *
 * Phase 11 — Director Notification Inbox.
 */

import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { AlertSeverity, DirectorAlert } from '@cachink/domain';
import { Icon, type IconName } from '../../components/Icon/index';
import { colors, fontSizes, typography } from '../../theme';
import { useTranslation } from '../../i18n/index';

export interface AlertCardProps {
  readonly alert: DirectorAlert;
  readonly onPress?: () => void;
  readonly onAction?: () => void;
  readonly testID?: string;
}

function severityIcon(severity: AlertSeverity): IconName {
  switch (severity) {
    case 'critical':
      return 'triangle-alert';
    case 'warning':
      return 'triangle-alert';
    case 'info':
      return 'info';
    default:
      return 'info';
  }
}

function severityColor(severity: AlertSeverity): string {
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

function formatRelativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

function AlertHeader({ alert, accent }: { alert: DirectorAlert; accent: string }): ReactElement {
  const { t } = useTranslation();
  return (
    <View flexDirection="row" alignItems="center" gap={8}>
      <Icon name={severityIcon(alert.severity)} size={18} color={accent} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.lg}
        color={colors.black}
        flexShrink={1}
      >
        {t(alert.titleKey)}
      </Text>
    </View>
  );
}

function AlertFooter({
  alert,
  onAction,
}: {
  alert: DirectorAlert;
  onAction?: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <View flexDirection="row" alignItems="center" justifyContent="space-between">
      <Text fontFamily={typography.fontFamily} fontSize={fontSizes.xs} color={colors.textMuted}>
        {formatRelativeTime(alert.createdAt)}
      </Text>
      {alert.actionRoute && (
        <Pressable onPress={onAction}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.semibold}
            fontSize={fontSizes.sm}
            color={colors.blueText}
          >
            {t('notificaciones.ver')} →
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function AlertCard(props: AlertCardProps): ReactElement {
  const { alert, onPress, onAction, testID } = props;
  const isUnread = !alert.read;
  const accent = severityColor(alert.severity);

  return (
    <Pressable onPress={onPress} testID={testID ?? `alert-card-${alert.id}`}>
      <View
        backgroundColor={isUnread ? colors.white : colors.gray100}
        borderRadius={10}
        borderWidth={2}
        borderColor={colors.black}
        borderLeftWidth={isUnread ? 4 : 2}
        borderLeftColor={isUnread ? accent : colors.black}
        padding={14}
        gap={6}
        opacity={isUnread ? 1 : 0.7}
      >
        <AlertHeader alert={alert} accent={accent} />
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.regular}
          fontSize={fontSizes.sm}
          color={colors.gray600}
          numberOfLines={2}
        >
          {alert.message}
        </Text>
        <AlertFooter alert={alert} onAction={onAction} />
      </View>
    </Pressable>
  );
}
