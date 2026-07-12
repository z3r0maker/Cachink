/**
 * CrashReportingToggle — Settings card for opting in/out of crash
 * reporting and bug data submission (Sentry + Supabase bug database).
 *
 * Mirrors the NotificationsToggle pattern. Pure UI: parent route
 * wires the appConfig write + Sentry init/close side-effect.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface CrashReportingToggleProps {
  readonly enabled: boolean;
  readonly onChange: (next: boolean) => void;
  readonly testID?: string;
}

export function CrashReportingToggle(props: CrashReportingToggleProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Card testID={props.testID ?? 'settings-crash-reporting-toggle'} padding="md" fullWidth>
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
            {t('settings.crashReportingToggleLabel')}
          </Text>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.medium}
            fontSize={14}
            color={colors.gray600}
            marginTop={4}
          >
            {t('settings.crashReportingToggleHint')}
          </Text>
        </View>
        <Btn
          variant={props.enabled ? 'green' : 'ghost'}
          size="sm"
          onPress={() => props.onChange(!props.enabled)}
          testID="settings-crash-reporting-btn"
        >
          {props.enabled ? t('common.yes') : t('common.no')}
        </Btn>
      </View>
    </Card>
  );
}
