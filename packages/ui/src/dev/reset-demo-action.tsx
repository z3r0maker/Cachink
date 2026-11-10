/**
 * ResetDemoAction — dev-only card that verifies the user's PIN,
 * then wipes the database and reloads the app.
 *
 * Guarded by `__DEV__` — tree-shaken out of production builds.
 */

import { useCallback, useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { compare } from 'bcryptjs';
import { attemptNip } from '@xangarro/caja/nip';
import type { UserId } from '@xangarro/domain';
import { Btn, Card, ConfirmDialog, Modal, PinCodeInput, SectionTitle } from '../components/index';
import { deviceNipGuard, nipRefusal } from '../app/pin-lockout';
import { useRepositories } from '../app/repository-provider';
import { useUserId } from '../app-config/use-app-config';
import { useTranslation } from '../i18n/index';
import { colors, fontSizes, typography } from '../theme';

type ResetStep = 'idle' | 'pin' | 'confirm' | 'pending' | 'error';

export interface ResetDemoActionProps {
  readonly resetDatabase: () => Promise<void>;
  readonly onReload: () => void;
}

export function ResetDemoAction(props: ResetDemoActionProps): ReactElement | null {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) return null;
  return <ResetDemoActionInner {...props} />;
}

function usePinSubmit(
  userId: UserId | null,
  repos: ReturnType<typeof useRepositories>,
  setPinError: (e: string | null) => void,
  setPinAttempt: (fn: (n: number) => number) => void,
  setStep: (s: ResetStep) => void,
) {
  const { t } = useTranslation();
  return useCallback(
    async (pin: string) => {
      if (!userId) return;
      const user = await repos.users.findById(userId);
      if (!user) {
        setPinError('Usuario no encontrado');
        return;
      }
      // This user's NIP lockout (audit F-08): a miss here counts toward it too.
      const attempt = await attemptNip(deviceNipGuard(repos.appConfig), userId, async () =>
        (await compare(pin, user.pinHash)) ? { ok: true, value: null } : { ok: false },
      );
      if (attempt.status !== 'ok') {
        setPinError(nipRefusal(attempt, t('dev.resetPinError')));
        setPinAttempt((n) => n + 1);
        return;
      }
      setPinError(null);
      setStep('confirm');
    },
    [userId, repos.users, repos.appConfig, t, setPinError, setPinAttempt, setStep],
  );
}

function useResetHandlers(
  props: ResetDemoActionProps,
  userId: UserId | null,
  repos: ReturnType<typeof useRepositories>,
) {
  const [step, setStep] = useState<ResetStep>('idle');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinAttempt, setPinAttempt] = useState(0);
  const handlePinSubmit = usePinSubmit(userId, repos, setPinError, setPinAttempt, setStep);

  const handleReset = useCallback(async () => {
    setStep('pending');
    try {
      await props.resetDatabase();
      props.onReload();
    } catch {
      setStep('error');
    }
  }, [props]);

  const handleDismissPin = useCallback(() => {
    setStep('idle');
    setPinError(null);
  }, []);

  return { step, setStep, pinError, pinAttempt, handlePinSubmit, handleReset, handleDismissPin };
}

function ResetDemoCard({
  step,
  setStep,
  t,
}: {
  step: ResetStep;
  setStep: (s: ResetStep) => void;
  t: (k: string) => string;
}): ReactElement {
  return (
    <Card testID="reset-demo-card" padding="md" fullWidth>
      <SectionTitle title={t('dev.resetTitle')} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.sm}
        color={step === 'error' ? colors.redText : colors.gray600}
        marginBottom={10}
      >
        {step === 'error' ? t('dev.resetError') : t('dev.resetHint')}
      </Text>
      <Btn
        variant="danger"
        onPress={() => setStep('pin')}
        disabled={step === 'pending'}
        fullWidth
        testID="reset-demo-btn"
      >
        {step === 'pending' ? '⏳ Borrando…' : t('dev.resetBtn')}
      </Btn>
    </Card>
  );
}

function ResetDemoActionInner(props: ResetDemoActionProps): ReactElement {
  const { t } = useTranslation();
  const repos = useRepositories();
  const userId = useUserId() as UserId | null;
  const h = useResetHandlers(props, userId, repos);

  return (
    <>
      <ResetDemoCard step={h.step} setStep={h.setStep} t={t} />
      <Modal
        open={h.step === 'pin'}
        onClose={h.handleDismissPin}
        title={t('dev.resetPinTitle')}
        testID="reset-pin-modal"
      >
        <PinGateContent key={h.pinAttempt} onSubmit={h.handlePinSubmit} error={h.pinError} />
      </Modal>
      <ConfirmDialog
        open={h.step === 'confirm'}
        onClose={() => h.setStep('idle')}
        onConfirm={h.handleReset}
        title={t('dev.resetConfirmTitle')}
        description={t('dev.resetConfirmBody')}
        confirmLabel={t('dev.resetConfirmBtn')}
        tone="danger"
      />
    </>
  );
}

/** Inline PIN entry inside the modal. */
function PinGateContent(props: {
  readonly onSubmit: (pin: string) => void;
  readonly error: string | null;
}): ReactElement {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');

  return (
    <View gap={16} alignItems="center" padding={8}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={fontSizes.lg}
        color={colors.gray600}
        textAlign="center"
      >
        {t('dev.resetPinPrompt')}
      </Text>
      <PinCodeInput
        value={pin}
        onChange={setPin}
        onComplete={props.onSubmit}
        error={props.error !== null}
        testID="reset-pin-input"
      />
      {props.error && (
        <Text fontFamily={typography.fontFamily} fontSize={fontSizes.sm} color={colors.redText}>
          {props.error}
        </Text>
      )}
    </View>
  );
}
