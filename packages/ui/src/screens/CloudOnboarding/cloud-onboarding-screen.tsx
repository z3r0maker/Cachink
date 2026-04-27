/**
 * CloudOnboardingScreen — first-time Cloud wizard flow (P1E-M3 C9-C10).
 *
 * Two tabs: **Iniciar sesión** / **Crear cuenta**. Plain email + password
 * with inline magic-link + password-reset links on the sign-in tab.
 * When the build has no backend URL and no BYO override is stored, shows
 * a disabled notice pointing at Settings → Avanzado.
 */

import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Card, SectionTitle, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import type { CloudCredentials } from '../../sync/cloud-bridge';
import {
  OnboardingForm,
  initialOnboardingForm,
  type OnboardingFormState,
  type OnboardingTab,
} from './onboarding-form';
import { DisabledNotice, SignInExtras, SubmitRow, TabSwitch } from './onboarding-chrome';

type T = ReturnType<typeof useTranslation>['t'];

export interface CloudOnboardingScreenProps {
  readonly backendConfigured: boolean;
  readonly onSignIn: (email: string, password: string) => Promise<CloudCredentials>;
  readonly onSignUp: (
    email: string,
    password: string,
    businessName: string,
  ) => Promise<CloudCredentials>;
  readonly onMagicLink?: (email: string) => Promise<void>;
  readonly onForgotPassword?: () => void;
  readonly onOpenAdvanced?: () => void;
  readonly onSuccess: (creds: CloudCredentials) => void;
  /**
   * Which tab should be active when the screen mounts (ADR-039 wizard
   * routing). Step 2A / Step 2B set `'signup'`; Step 3 sets `'signin'`.
   * Settings re-runs default to `'signin'`. Omitted defaults to
   * `'signin'` for back-compat.
   */
  readonly initialTab?: OnboardingTab;
  readonly testID?: string;
}

function useCloudForm(props: CloudOnboardingScreenProps, tab: OnboardingTab) {
  const { t } = useTranslation();
  const [state, setState] = useState<OnboardingFormState>(initialOnboardingForm);
  const setField = (k: keyof OnboardingFormState, v: string) => setState((s) => ({ ...s, [k]: v }));

  async function submit(): Promise<void> {
    setState((s) => ({ ...s, status: 'submitting', errorMsg: null }));
    try {
      const creds =
        tab === 'signin'
          ? await props.onSignIn(state.email, state.password)
          : await props.onSignUp(state.email, state.password, state.businessName);
      props.onSuccess(creds);
      setState(initialOnboardingForm());
    } catch (err) {
      setState((s) => ({
        ...s,
        status: 'error',
        errorMsg: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  async function magicLink(): Promise<void> {
    if (!props.onMagicLink || state.email.length === 0) return;
    setState((s) => ({ ...s, status: 'submitting', errorMsg: null }));
    try {
      await props.onMagicLink(state.email);
      setState((s) => ({ ...s, status: 'idle' }));
    } catch (err) {
      setState((s) => ({
        ...s,
        status: 'error',
        errorMsg: err instanceof Error ? err.message : String(err),
      }));
    }
  }
  return { t, state, setField, submit, magicLink };
}

function OnboardingCard({
  t,
  tab,
  controller,
  props,
}: {
  t: T;
  tab: OnboardingTab;
  controller: ReturnType<typeof useCloudForm>;
  props: CloudOnboardingScreenProps;
}): ReactElement {
  const { state, setField, submit, magicLink } = controller;
  return (
    <Card padding="md" fullWidth>
      <OnboardingForm t={t} tab={tab} state={state} setField={setField} onSubmitEditing={submit} />
      <SubmitRow t={t} tab={tab} state={state} submit={submit} />
      {tab === 'signin' && (
        <SignInExtras
          t={t}
          onMagicLink={props.onMagicLink}
          onForgotPassword={props.onForgotPassword}
          magicLink={magicLink}
        />
      )}
    </Card>
  );
}

function OnboardingBody({
  t,
  tab,
  setTab,
  controller,
  props,
}: {
  t: T;
  tab: OnboardingTab;
  setTab: (tab: OnboardingTab) => void;
  controller: ReturnType<typeof useCloudForm>;
  props: CloudOnboardingScreenProps;
}): ReactElement {
  const { state } = controller;
  return (
    <>
      <TabSwitch t={t} tab={tab} setTab={setTab} />
      <OnboardingCard t={t} tab={tab} controller={controller} props={props} />
      {state.status === 'error' && state.errorMsg && (
        <Tag variant="danger" testID="cloud-onboarding-error">
          {state.errorMsg}
        </Tag>
      )}
    </>
  );
}

export function CloudOnboardingScreen(props: CloudOnboardingScreenProps): ReactElement {
  const [tab, setTab] = useState<OnboardingTab>(props.initialTab ?? 'signin');
  const controller = useCloudForm(props, tab);
  const { t } = controller;
  return (
    <View
      testID={props.testID ?? 'cloud-onboarding-screen'}
      flex={1}
      padding={20}
      gap={12}
      backgroundColor={colors.offwhite}
    >
      <SectionTitle title={t('cloudOnboarding.title')} />
      {props.backendConfigured ? (
        <OnboardingBody t={t} tab={tab} setTab={setTab} controller={controller} props={props} />
      ) : (
        <DisabledNotice t={t} onOpenAdvanced={props.onOpenAdvanced} />
      )}
    </View>
  );
}
