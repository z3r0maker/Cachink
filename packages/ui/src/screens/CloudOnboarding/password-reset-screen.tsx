/**
 * PasswordResetScreen — triggers a Supabase password-reset email
 * (P1E-M3 C10).
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card, SectionTitle, Tag } from '../../components/index';
import { EmailField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface PasswordResetScreenProps {
  readonly onReset: (email: string) => Promise<void>;
  readonly onBack: () => void;
  readonly testID?: string;
}

type Status = 'idle' | 'sending' | 'sent' | 'error';

type T = ReturnType<typeof useTranslation>['t'];

function useResetController(props: PasswordResetScreenProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  async function submit(): Promise<void> {
    setStatus('sending');
    setErrorMsg(null);
    try {
      await props.onReset(email);
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }
  return { email, setEmail, status, errorMsg, submit };
}

function ResetForm({
  t,
  email,
  setEmail,
  submit,
  status,
}: {
  t: T;
  email: string;
  setEmail: (v: string) => void;
  submit: () => Promise<void>;
  status: Status;
}): ReactElement {
  return (
    <Card padding="md" fullWidth>
      <EmailField
        label={t('passwordReset.emailLabel')}
        value={email}
        onChange={setEmail}
        placeholder="tú@correo.com"
        testID="password-reset-email"
        returnKeyType="send"
        onSubmitEditing={() => {
          void submit();
        }}
      />
      <View marginTop={12}>
        <Btn
          variant="primary"
          onPress={submit}
          fullWidth
          testID="password-reset-submit"
          disabled={status === 'sending' || status === 'sent'}
        >
          {status === 'sending' ? t('passwordReset.sending') : t('passwordReset.cta')}
        </Btn>
      </View>
    </Card>
  );
}

export function PasswordResetScreen(props: PasswordResetScreenProps): ReactElement {
  const { t } = useTranslation();
  const { email, setEmail, status, errorMsg, submit } = useResetController(props);
  return (
    <View
      testID={props.testID ?? 'password-reset-screen'}
      flex={1}
      padding={20}
      gap={16}
      backgroundColor={colors.offwhite}
    >
      <SectionTitle title={t('passwordReset.title')} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={14}
        color={colors.gray600}
      >
        {t('passwordReset.body')}
      </Text>
      <ResetForm t={t} email={email} setEmail={setEmail} submit={submit} status={status} />
      {status === 'sent' && (
        <Tag variant="success" testID="password-reset-sent">
          {t('passwordReset.sent')}
        </Tag>
      )}
      {status === 'error' && errorMsg && (
        <Tag variant="danger" testID="password-reset-error">
          {errorMsg}
        </Tag>
      )}
      <Btn variant="ghost" onPress={props.onBack} fullWidth testID="password-reset-back">
        {t('passwordReset.back')}
      </Btn>
    </View>
  );
}
