/**
 * DirectorSetupScreen — first-run Director account creation.
 *
 * Shown when a business exists but has no users. The Director must
 * create their account before anyone can use the app.
 *
 * ADR-049: PIN first (login credential), recovery password second.
 */

import { useState, type ReactElement } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import { Btn, PasswordField, TextField } from '../../components/index';
import { Input } from '../../components/Input/input';
import { FloatingCoinsBackground, SafeAreaSpacer } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { DirectorSetupValidation } from './director-setup-validation';

export interface DirectorSetupSubmitInput {
  readonly nombre: string;
  readonly email?: string;
  readonly pin: string;
  readonly recoveryPassword: string;
}

export interface DirectorSetupScreenProps {
  readonly onSubmit: (input: DirectorSetupSubmitInput) => void;
  readonly submitting: boolean;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function ErrorHint(props: { readonly text: string | undefined }): ReactElement | null {
  if (!props.text) return null;
  return (
    <Text fontFamily={typography.fontFamily} fontSize={12} color={colors.red} marginTop={-8}>
      {props.text}
    </Text>
  );
}

function useDirectorSetupForm(props: DirectorSetupScreenProps) {
  const { t } = useTranslation();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [confirmRecoveryPassword, setConfirmRecoveryPassword] = useState('');
  const validation = DirectorSetupValidation.validate({
    nombre,
    pin,
    confirmPin,
    recoveryPassword,
    confirmRecoveryPassword,
  });
  const handleSubmit = (): void => {
    if (!validation.valid) return;
    props.onSubmit({ nombre, email: email.length > 0 ? email : undefined, pin, recoveryPassword });
  };
  return {
    t,
    nombre,
    setNombre,
    email,
    setEmail,
    pin,
    setPin,
    confirmPin,
    setConfirmPin,
    recoveryPassword,
    setRecoveryPassword,
    confirmRecoveryPassword,
    setConfirmRecoveryPassword,
    validation,
    handleSubmit,
  };
}

type Form = ReturnType<typeof useDirectorSetupForm>;

function DirectorSetupHeader({ t }: { t: T }): ReactElement {
  return (
    <>
      <SafeAreaSpacer />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={32}
        color={colors.black}
      >
        {t('directorSetup.title')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontSize={14}
        color={colors.gray600}
        textAlign="center"
        maxWidth={360}
      >
        {t('directorSetup.subtitle')}
      </Text>
    </>
  );
}

function handleConfirmPin(form: Form, v: string): void {
  const trimmed = v.slice(0, 6);
  form.setConfirmPin(trimmed);
  if (trimmed.length === 6) Keyboard.dismiss();
}

function DirectorCredentialFields({ form }: { form: Form }): ReactElement {
  return (
    <>
      <Input
        type="number"
        value={form.pin}
        onChange={(v) => form.setPin(v.slice(0, 6))}
        label={form.t('directorSetup.pin')}
        testID="director-pin"
        placeholder="000000"
      />
      <Input
        type="number"
        value={form.confirmPin}
        onChange={(v) => handleConfirmPin(form, v)}
        label={form.t('directorSetup.confirmPin')}
        testID="director-confirm-pin"
        error={form.validation.errors.confirmPin}
      />
      <PasswordField
        value={form.recoveryPassword}
        onChange={form.setRecoveryPassword}
        label={form.t('directorSetup.recoveryPassword')}
        testID="director-recovery-password"
        autoComplete="new-password"
      />
      <PasswordField
        value={form.confirmRecoveryPassword}
        onChange={form.setConfirmRecoveryPassword}
        label={form.t('directorSetup.confirmRecoveryPassword')}
        testID="director-confirm-recovery-password"
        autoComplete="new-password"
      />
      <ErrorHint text={form.validation.errors.confirmRecoveryPassword} />
    </>
  );
}

function DirectorSetupFields({
  form,
  submitting,
}: {
  form: Form;
  submitting: boolean;
}): ReactElement {
  const { t, nombre, setNombre, email, setEmail, validation, handleSubmit } = form;
  return (
    <View width="100%" maxWidth={360} gap={12}>
      <TextField
        value={nombre}
        onChange={setNombre}
        label={t('directorSetup.nombre')}
        testID="director-nombre"
        required
      />
      <TextField
        value={email}
        onChange={setEmail}
        label={t('directorSetup.email')}
        testID="director-email"
        placeholder={t('directorSetup.emailHint')}
      />
      <DirectorCredentialFields form={form} />
      <Btn
        variant="dark"
        onPress={handleSubmit}
        fullWidth
        disabled={!validation.valid}
        loading={submitting}
        testID="director-setup-submit"
      >
        {t('directorSetup.submit')}
      </Btn>
    </View>
  );
}

export function DirectorSetupScreen(props: DirectorSetupScreenProps): ReactElement {
  const form = useDirectorSetupForm(props);
  return (
    <FloatingCoinsBackground testID={props.testID ?? 'director-setup'}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            gap: 16,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <DirectorSetupHeader t={form.t} />
          <DirectorSetupFields form={form} submitting={props.submitting} />
        </ScrollView>
      </KeyboardAvoidingView>
    </FloatingCoinsBackground>
  );
}
