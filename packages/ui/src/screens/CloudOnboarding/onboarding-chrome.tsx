/**
 * Small presentational helpers extracted from CloudOnboardingScreen so
 * the main file stays under the 200-line budget (CLAUDE.md §4.4).
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card } from '../../components/index';
import type { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import type { OnboardingFormState, OnboardingTab } from './onboarding-form';

type T = ReturnType<typeof useTranslation>['t'];

export function TabSwitch({
  t,
  tab,
  setTab,
}: {
  t: T;
  tab: OnboardingTab;
  setTab: (tab: OnboardingTab) => void;
}): ReactElement {
  return (
    <View flexDirection="row" gap={8} marginBottom={8}>
      <Btn
        variant={tab === 'signin' ? 'dark' : 'ghost'}
        size="sm"
        onPress={() => setTab('signin')}
        testID="cloud-tab-signin"
      >
        {t('cloudOnboarding.signInTab')}
      </Btn>
      <Btn
        variant={tab === 'signup' ? 'dark' : 'ghost'}
        size="sm"
        onPress={() => setTab('signup')}
        testID="cloud-tab-signup"
      >
        {t('cloudOnboarding.signUpTab')}
      </Btn>
    </View>
  );
}

export function DisabledNotice({
  t,
  onOpenAdvanced,
}: {
  t: T;
  onOpenAdvanced?: () => void;
}): ReactElement {
  return (
    <Card padding="md" fullWidth testID="cloud-onboarding-disabled">
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={14}
        color={colors.gray600}
        marginBottom={12}
      >
        {t('cloudOnboarding.disabledHint')}
      </Text>
      {onOpenAdvanced && (
        <Btn variant="soft" onPress={onOpenAdvanced} fullWidth testID="cloud-open-advanced">
          {t('cloudOnboarding.openAdvanced')}
        </Btn>
      )}
    </Card>
  );
}

export function SubmitRow({
  t,
  tab,
  state,
  submit,
}: {
  t: T;
  tab: OnboardingTab;
  state: OnboardingFormState;
  submit: () => Promise<void>;
}): ReactElement {
  const label =
    state.status === 'submitting'
      ? t('cloudOnboarding.submitting')
      : tab === 'signin'
        ? t('cloudOnboarding.signInCta')
        : t('cloudOnboarding.signUpCta');
  return (
    <View marginTop={14}>
      <Btn
        variant="primary"
        onPress={submit}
        fullWidth
        testID="cloud-submit"
        disabled={state.status === 'submitting'}
      >
        {label}
      </Btn>
    </View>
  );
}

export function SignInExtras({
  t,
  onMagicLink,
  onForgotPassword,
  magicLink,
}: {
  t: T;
  onMagicLink?: (email: string) => Promise<void>;
  onForgotPassword?: () => void;
  magicLink: () => Promise<void>;
}): ReactElement {
  return (
    <>
      {onMagicLink && (
        <View marginTop={8}>
          <Btn variant="ghost" size="sm" onPress={magicLink} fullWidth testID="cloud-magic-link">
            {t('cloudOnboarding.magicLink')}
          </Btn>
        </View>
      )}
      {onForgotPassword && (
        <View marginTop={4}>
          <Btn variant="ghost" size="sm" onPress={onForgotPassword} fullWidth testID="cloud-forgot">
            {t('cloudOnboarding.forgotPassword')}
          </Btn>
        </View>
      )}
    </>
  );
}
