/**
 * ActivationScreen — first screen of a fresh install (A-04, ADR-053 §2).
 *
 * Email + 8-character code. No purchase UI and no checkout link: the
 * footnote names the website as plain text (app-store steering, ADR-053
 * consequences). The CTA stays above the fold on small phones.
 */

import { useState, type ReactElement } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import { AVISO_VINCULACION } from '@xangarro/domain';
import { Btn, FloatingCoinsBackground, SafeAreaSpacer } from '../../components/index';
import { Input } from '../../components/Input/input';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';
import { canSubmitActivation, sanitizeCode } from './activation-form';

export interface ActivationScreenProps {
  readonly onSubmit: (input: { email: string; code: string }) => void;
  readonly submitting: boolean;
  /** i18n key of the current error, if any. */
  readonly errorKey?: string | null;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function Header({ t }: { t: T }): ReactElement {
  return (
    <>
      <SafeAreaSpacer />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={fontSizes.xl5}
        color={colors.black}
        textAlign="center"
      >
        {t('activate.title')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontSize={fontSizes.md}
        color={colors.gray600}
        textAlign="center"
        maxWidth={360}
      >
        {t('activate.subtitle')}
      </Text>
    </>
  );
}

function Footnote({ t, errorKey }: { t: T; errorKey?: string | null }): ReactElement {
  return (
    <>
      {errorKey ? (
        <Text
          testID="activation-error"
          fontFamily={typography.fontFamily}
          fontSize={fontSizes.sm}
          color={colors.redText}
          textAlign="center"
        >
          {t(errorKey as never)}
        </Text>
      ) : null}
      <Text
        fontFamily={typography.fontFamily}
        fontSize={fontSizes.sm}
        color={colors.gray600}
        textAlign="center"
      >
        {t('activate.noCode')}
      </Text>
      <AvisoVinculacion />
    </>
  );
}

/** N-34, variante B: the aviso at linking, no checkbox; its version goes with the request. */
function AvisoVinculacion(): ReactElement {
  return (
    <Text
      testID="activation-aviso"
      fontFamily={typography.fontFamily}
      fontSize={fontSizes.xs}
      color={colors.gray600}
      textAlign="center"
    >
      {AVISO_VINCULACION.join(' ')}
    </Text>
  );
}

function Fields(props: ActivationScreenProps & { t: T }): ReactElement {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const ready = canSubmitActivation(email, code);
  return (
    <View width="100%" maxWidth={360} gap={12}>
      <Input
        type="email"
        value={email}
        onChange={setEmail}
        label={props.t('activate.emailLabel')}
        testID="activation-email"
      />
      <Input
        type="text"
        value={code}
        onChange={(v) => setCode(sanitizeCode(v))}
        label={props.t('activate.codeLabel')}
        note={props.t('activate.codeHint')}
        testID="activation-code"
      />
      <Btn
        variant="dark"
        onPress={() => props.onSubmit({ email: email.trim(), code })}
        fullWidth
        disabled={!ready}
        loading={props.submitting}
        testID="activation-submit"
      >
        {props.t('activate.submit')}
      </Btn>
      <Footnote t={props.t} errorKey={props.errorKey} />
    </View>
  );
}

export function ActivationScreen(props: ActivationScreenProps): ReactElement {
  const { t } = useTranslation();
  return (
    <FloatingCoinsBackground testID={props.testID ?? 'activation-screen'}>
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
          <Header t={t} />
          <Fields {...props} t={t} />
        </ScrollView>
      </KeyboardAvoidingView>
    </FloatingCoinsBackground>
  );
}
