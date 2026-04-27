/**
 * NotificationsToggle — Settings card letting the Director opt in /
 * out of the daily stock-low push notification (P1C-M11-T03, S4-C12).
 *
 * Reads `useNotificationsEnabled()` and calls `appConfig.set(...)` +
 * `setNotificationsEnabled(...)` on change. Pure UI: the parent route
 * wires the repository write.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface NotificationsToggleProps {
  readonly enabled: boolean;
  readonly onChange: (next: boolean) => void;
  readonly testID?: string;
}

export function NotificationsToggle(props: NotificationsToggleProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Card testID={props.testID ?? 'settings-notifications-toggle'} padding="md" fullWidth>
      <View flexDirection="row" justifyContent="space-between" alignItems="center" gap={12}>
        <View flex={1} paddingRight={12}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={12}
            letterSpacing={typography.letterSpacing.wide}
            color={colors.gray600}
            style={{ textTransform: 'uppercase' }}
          >
            {t('settings.notificacionesLabel')}
          </Text>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.medium}
            fontSize={14}
            color={colors.gray600}
            marginTop={4}
          >
            {t('settings.notificacionesHint')}
          </Text>
        </View>
        <Btn
          variant={props.enabled ? 'green' : 'ghost'}
          size="sm"
          onPress={() => props.onChange(!props.enabled)}
          testID="settings-notifications-btn"
        >
          {props.enabled ? t('common.yes') : t('common.no')}
        </Btn>
      </View>
    </Card>
  );
}
