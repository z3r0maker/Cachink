/**
 * QuickSwitchHeader — greeting, business name, date, and subtitle.
 *
 * Time-aware greeting changes with current hour:
 *   06:00–11:59 → ¡Buenos días!
 *   12:00–17:59 → ¡Buenas tardes!
 *   18:00–05:59 → ¡Buenas noches!
 */

import type { ReactElement } from 'react';
import { Text } from '@tamagui/core';
import { SafeAreaSpacer } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

/** Resolve greeting i18n key from current hour. */
function greetingKey(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'login.greetingMorning';
  if (h >= 12 && h < 18) return 'login.greetingAfternoon';
  return 'login.greetingEvening';
}

/** Format today's date in long Spanish format. */
function todayFormatted(): string {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function SubtitleLine({ text, testID }: { text: string; testID?: string }): ReactElement {
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.medium}
      fontSize={13}
      color={colors.gray400}
      textAlign="center"
      testID={testID}
    >
      {text}
    </Text>
  );
}

export function QuickSwitchHeader({ businessName }: { businessName?: string }): ReactElement {
  const { t } = useTranslation();

  return (
    <>
      <SafeAreaSpacer />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={36}
        letterSpacing={-1}
        color={colors.black}
      >
        {t(greetingKey() as 'login.greetingMorning')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={16}
        color={colors.gray600}
      >
        {t('login.selectUser')}
      </Text>
      {businessName !== undefined && (
        <SubtitleLine text={businessName} testID="login-business-name" />
      )}
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={12}
        color={colors.gray400}
        textAlign="center"
        testID="login-date"
      >
        {todayFormatted()}
      </Text>
    </>
  );
}
