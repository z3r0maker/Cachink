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
import { colors, fontSizes, typography } from '../../theme';

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
      fontSize={fontSizes.sm}
      color={colors.textMuted}
      textAlign="center"
      testID={testID}
    >
      {text}
    </Text>
  );
}

export function QuickSwitchHeader({
  businessName,
  compact = false,
}: {
  businessName?: string;
  /**
   * Drop the welcome chrome (greeting, "selecciona tu usuario", date) and keep
   * only the business name.
   *
   * Set once a user is selected: at that point the PIN pad is on screen and the
   * welcome copy is dead weight. Measured on an iPhone 17 (874pt), the full
   * screen is 1087pt of content — 213pt of overflow — which pushed
   * `login-submit`, `numpad-0`, `numpad-backspace` and `forgot-pin-link`
   * entirely below the fold, where XCUITest cannot even see them.
   */
  compact?: boolean;
}): ReactElement {
  return compact ? (
    <>
      <SafeAreaSpacer />
      {businessName !== undefined && (
        <SubtitleLine text={businessName} testID="login-business-name" />
      )}
    </>
  ) : (
    <FullHeader businessName={businessName} />
  );
}

/** The welcome chrome: greeting, prompt, business name, date. */
function FullHeader({ businessName }: { businessName?: string }): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <SafeAreaSpacer />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={fontSizes.xl6}
        letterSpacing={-1}
        color={colors.black}
      >
        {t(greetingKey() as 'login.greetingMorning')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.lg}
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
        fontSize={fontSizes.xs}
        color={colors.textMuted}
        textAlign="center"
        testID="login-date"
      >
        {todayFormatted()}
      </Text>
    </>
  );
}
