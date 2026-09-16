/**
 * StepConsent — wizard step for crash reporting opt-in (Audit M-1 PR 6).
 *
 * Reuses the ConsentModal body but renders inline within the wizard
 * layout instead of as a Modal overlay. Moving consent into the wizard
 * eliminates the jarring modal-on-first-launch pattern.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';

export interface StepConsentProps {
  readonly onComplete: (choice: boolean | null) => void;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function ConsentButtons({
  onComplete,
  t,
}: {
  onComplete: (c: boolean | null) => void;
  t: T;
}): ReactElement {
  return (
    <View flexDirection="row" gap={10} flexWrap="wrap" justifyContent="center">
      <Btn variant="green" onPress={() => onComplete(true)} testID="consent-yes">
        {t('settings.crashReportingYes')}
      </Btn>
      <Btn variant="ghost" onPress={() => onComplete(false)} testID="consent-no">
        {t('settings.crashReportingNo')}
      </Btn>
    </View>
  );
}

export function StepConsent(props: StepConsentProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      testID={props.testID ?? 'wizard-step-consent'}
      flex={1}
      padding={24}
      gap={20}
      justifyContent="center"
      alignItems="center"
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={fontSizes.xl2}
        color={colors.black}
        textAlign="center"
      >
        {t('settings.crashReportingTitle')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.lg}
        color={colors.gray600}
        textAlign="center"
        maxWidth={360}
      >
        {t('settings.crashReportingBody')}
      </Text>
      <ConsentButtons onComplete={props.onComplete} t={t} />
    </View>
  );
}
