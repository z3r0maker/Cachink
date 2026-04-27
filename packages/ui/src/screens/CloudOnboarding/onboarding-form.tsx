/**
 * Form body for CloudOnboardingScreen — extracted so the parent stays
 * under the 40-line function limit (CLAUDE.md §4.4).
 *
 * Audit M-1 PR 2.5 — closes blocker 1.2 (passwords were rendered in
 * plaintext; the `********` placeholder was cosmetic only). Migrated
 * to the new field primitives:
 *   - `<EmailField>` — email keyboard, `autoComplete="email"`,
 *     `autoCapitalize="none"`.
 *   - `<PasswordField>` — masked, with the show/hide toggle.
 *     `autoComplete` switches to `'new-password'` on the sign-up tab so
 *     OS password managers store the new credential rather than
 *     overwriting an existing one.
 *   - `<TextField>` for the business name on sign-up.
 *
 * Form state still flows through the parent's `useOnboardingController`
 * hook — we don't fold this into RHF here because the parent owns the
 * `submit / submitting / errorMsg` lifecycle and adding RHF without
 * changing the controller would just split state across two homes.
 * A full RHF migration ships once the controller itself is rewritten.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { EmailField, PasswordField, TextField } from '../../components/fields/index';
import type { useTranslation } from '../../i18n/index';

type T = ReturnType<typeof useTranslation>['t'];
export type OnboardingTab = 'signin' | 'signup';

export interface OnboardingFormState {
  email: string;
  password: string;
  businessName: string;
  status: 'idle' | 'submitting' | 'error';
  errorMsg: string | null;
}

export function initialOnboardingForm(): OnboardingFormState {
  return { email: '', password: '', businessName: '', status: 'idle', errorMsg: null };
}

export interface OnboardingFormProps {
  readonly t: T;
  readonly tab: OnboardingTab;
  readonly state: OnboardingFormState;
  readonly setField: (k: keyof OnboardingFormState, v: string) => void;
  /**
   * Audit 5.4 — Bluetooth-keyboard Enter-to-submit. Wired on the last
   * field of each tab variant (password on sign-in, businessName on
   * sign-up) so iPad-keyboard users can finish onboarding without
   * tapping the screen.
   */
  readonly onSubmitEditing?: () => void;
}

export function OnboardingForm(props: OnboardingFormProps): ReactElement {
  const { t, tab, state, setField } = props;
  return (
    <>
      <EmailField
        label={t('cloudOnboarding.emailLabel')}
        value={state.email}
        onChange={(v) => setField('email', v)}
        placeholder="tú@correo.com"
        testID="cloud-email-input"
        returnKeyType="next"
      />
      <View marginTop={12}>
        <PasswordField
          label={t('cloudOnboarding.passwordLabel')}
          value={state.password}
          onChange={(v) => setField('password', v)}
          autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
          testID="cloud-password-input"
          returnKeyType={tab === 'signup' ? 'next' : 'done'}
          onSubmitEditing={tab === 'signup' ? undefined : props.onSubmitEditing}
        />
      </View>
      {tab === 'signup' && (
        <View marginTop={12}>
          <TextField
            label={t('cloudOnboarding.businessNameLabel')}
            value={state.businessName}
            onChange={(v) => setField('businessName', v)}
            placeholder={t('cloudOnboarding.businessNamePlaceholder')}
            testID="cloud-business-input"
            returnKeyType="done"
            onSubmitEditing={props.onSubmitEditing}
          />
        </View>
      )}
    </>
  );
}
