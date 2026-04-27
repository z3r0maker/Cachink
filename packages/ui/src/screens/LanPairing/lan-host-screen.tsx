/**
 * LanHostScreen — desktop-only "Ser el servidor local" flow (P1D-M4 C17).
 *
 * Calls a platform-provided `startServer()` (wired in apps/desktop's
 * shell → Tauri `lan_server_start` command) and renders the returned
 * QR + URL + pairing-token so tablets can scan to join.
 *
 * Pure UI here — the Tauri invoke happens in the app-shell route.
 */

import { useEffect, useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card, SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface LanHostStartResult {
  readonly url: string;
  readonly pairingToken: string;
  readonly qrPngBase64: string;
}

export interface LanHostScreenProps {
  readonly startServer: () => Promise<LanHostStartResult>;
  readonly onContinue: (result: LanHostStartResult) => void | Promise<void>;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function useStartHost(startServer: LanHostScreenProps['startServer']) {
  const [status, setStatus] = useState<'starting' | 'ready' | 'error'>('starting');
  const [data, setData] = useState<LanHostStartResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await startServer();
        if (cancelled) return;
        setData(res);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [startServer]);
  return { status, data, error };
}

function StartingMsg({ t }: { t: T }): ReactElement {
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.medium}
      fontSize={14}
      color={colors.gray600}
    >
      {t('lanPairing.hostStarting')}
    </Text>
  );
}

function ErrorMsg({ t, error }: { t: T; error: string | null }): ReactElement {
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.semibold}
      fontSize={13}
      color={colors.red}
      testID="lan-host-error"
    >
      {error ?? t('lanPairing.hostError')}
    </Text>
  );
}

function QrCard({ t, data }: { t: T; data: LanHostStartResult }): ReactElement {
  return (
    <Card padding="md" fullWidth testID="lan-host-qr-card">
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={13}
        letterSpacing={typography.letterSpacing.wide}
        color={colors.gray600}
        style={{ textTransform: 'uppercase' }}
      >
        {t('lanPairing.hostQrHeading')}
      </Text>
      <View alignItems="center" marginVertical={12}>
        <img
          src={`data:image/png;base64,${data.qrPngBase64}`}
          width={240}
          height={240}
          alt="QR"
          data-testid="lan-host-qr-img"
        />
      </View>
    </Card>
  );
}

export function LanHostScreen(props: LanHostScreenProps): ReactElement {
  const { t } = useTranslation();
  const { status, data, error } = useStartHost(props.startServer);
  return (
    <View
      testID={props.testID ?? 'lan-host-screen'}
      flex={1}
      padding={20}
      gap={16}
      backgroundColor={colors.offwhite}
    >
      <SectionTitle title={t('lanPairing.hostTitle')} />
      {status === 'starting' && <StartingMsg t={t} />}
      {status === 'error' && <ErrorMsg t={t} error={error} />}
      {status === 'ready' && data && (
        <>
          <QrCard t={t} data={data} />
          <Card padding="md" fullWidth>
            <DetailRow label={t('lanPairing.hostUrlLabel')} value={data.url} />
            <DetailRow label={t('lanPairing.hostTokenLabel')} value={data.pairingToken} />
          </Card>
          <Btn
            variant="primary"
            onPress={() => props.onContinue(data)}
            fullWidth
            testID="lan-host-continue"
          >
            {t('lanPairing.hostContinue')}
          </Btn>
        </>
      )}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-between" paddingVertical={6}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={12}
        letterSpacing={typography.letterSpacing.wide}
        color={colors.gray600}
        style={{ textTransform: 'uppercase' }}
      >
        {label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={13}
        color={colors.black}
        numberOfLines={1}
        maxWidth={260}
      >
        {value}
      </Text>
    </View>
  );
}
