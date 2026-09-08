/**
 * NotificationBadge — small red circle with unread count overlay.
 *
 * Renders a bell icon with an optional count badge. Displays "9+"
 * when count exceeds 9. Hidden (renders just the bell) when count is 0.
 *
 * Phase 11 — Director Notification Inbox.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Pressable } from 'react-native';
import { Icon } from '../Icon/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, shapeRadii, typography } from '../../theme';

export interface NotificationBadgeProps {
  readonly count: number;
  readonly onPress?: () => void;
  readonly testID?: string;
}

function formatBadgeCount(count: number): string {
  if (count <= 0) return '';
  if (count > 9) return '9+';
  return String(count);
}

function CountDot({ label }: { label: string }): ReactElement {
  return (
    <View
      position="absolute"
      top={2}
      right={2}
      minWidth={18}
      height={18}
      borderRadius={shapeRadii.pill}
      backgroundColor={colors.red}
      alignItems="center"
      justifyContent="center"
      paddingHorizontal={4}
      testID="notification-badge-count"
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.xs}
        color={colors.white}
        lineHeight={12}
      >
        {label}
      </Text>
    </View>
  );
}

export function NotificationBadge(props: NotificationBadgeProps): ReactElement {
  const { t } = useTranslation();
  const { count, onPress, testID } = props;
  const label = formatBadgeCount(count);

  return (
    <Pressable
      onPress={onPress}
      role="button"
      // 36pt glyph + 4pt slop each side = 44pt, the iOS HIG floor.
      hitSlop={4}
      aria-label={t('notificaciones.badgeAriaLabel', { count })}
      testID={testID ?? 'notification-badge'}
    >
      <View position="relative" width={36} height={36} alignItems="center" justifyContent="center">
        <Icon name="bell" size={22} color={colors.gray600} />
        {count > 0 && <CountDot label={label} />}
      </View>
    </Pressable>
  );
}
