/**
 * DirectorSetupScreen — first-run Director account creation.
 *
 * Shown when a business exists but has no users. The Director must
 * create their account before anyone can use the app.
 *
 * ADR-049: PIN first (login credential), recovery password second.
 *
 * Note: Email and recovery password fields are hidden for now — email
 * recovery is not yet available. The recovery password is auto-set to
 * the PIN value so the domain layer receives a valid value. When email
 * recovery launches, re-add those fields here.
 */

import { useRef, useState, type ReactElement } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, type TextInput } from 'react-native';
import { Text, View } from '@tamagui/core';
import { Btn, TextField } from '../../components/index';
import { Input } from '../../components/Input/input';
import { FloatingCoinsBackground, SafeAreaSpacer } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { DirectorSetupValidation } from './director-setup-validation';

export interface DirectorSetupSubmitInput {
  readonly nombre: string;
  readonly pin: string;
  readonly recoveryPassword: string;
}

export interface DirectorSetupScreenProps {
  readonly onSubmit: (input: DirectorSetupSubmitInput) => void;
  readonly submitting: boolean;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function useDirectorSetupForm(props: DirectorSetupScreenProps) {
  const { t } = useTranslation();
  const [nombre, setNombre] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const pinRef = useRef<TextInput>(null);
  const confirmPinRef = useRef<TextInput>(null);
  const validation = DirectorSetupValidation.validate({
    nombre,
    pin,
    confirmPin,
  });
  const handleSubmit = (): void => {
    if (!validation.valid) return;
    props.onSubmit({ nombre, pin, recoveryPassword: pin });
  };
  return {
    t,
    nombre,
    setNombre,
    pin,
    setPin,
    confirmPin,
    setConfirmPin,
    validation,
    handleSubmit,
    pinRef,
    confirmPinRef,
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

function handlePin(form: Form, v: string): void {
  const trimmed = v.slice(0, 6);
  form.setPin(trimmed);
  // iOS number-pad has no return key — auto-advance to confirmPin on 6 digits
  if (trimmed.length === 6) (form.confirmPinRef.current as TextInput | null)?.focus();
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
        onChange={(v) => handlePin(form, v)}
        label={form.t('directorSetup.pin')}
        testID="director-pin"
        placeholder="000000"
        inputRef={form.pinRef}
      />
      <Input
        type="number"
        value={form.confirmPin}
        onChange={(v) => handleConfirmPin(form, v)}
        label={form.t('directorSetup.confirmPin')}
        testID="director-confirm-pin"
        error={form.validation.errors.confirmPin}
        inputRef={form.confirmPinRef}
      />
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
  const { t, nombre, setNombre, validation, handleSubmit } = form;
  return (
    <View width="100%" maxWidth={360} gap={12}>
      <TextField
        value={nombre}
        onChange={setNombre}
        label={t('directorSetup.nombre')}
        testID="director-nombre"
        required
        returnKeyType="next"
        onSubmitEditing={() => (form.pinRef.current as TextInput | null)?.focus()}
        blurOnSubmit={false}
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
