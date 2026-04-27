/**
 * LanJoinScreen — client-side pairing flow (P1D-M4 C17).
 *
 * Shown in the GatedNavigation branch for `mode === 'lan'` when no
 * pairing credentials are stored yet. Two entry points:
 *   1. **Scan QR** — calls a platform-provided scanner that returns a
 *      `cachink-lan://<host>:<port>?token=<t>` URL (mobile wraps
 *      `BarcodeScanner`, desktop uses `getUserMedia` per ADR-022).
 *   2. **Paste URL** — a plain text input as the always-available fallback.
 *
 * On a successful pair the component calls `props.onPaired(...)`, which
 * the route uses to persist the access-token into `__cachink_sync_state`
 * and advance GatedNavigation to RolePicker.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card, SectionTitle } from '../../components/index';
import { TextField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface LanPairSuccess {
  readonly serverUrl: string;
  readonly accessToken: string;
  readonly businessId: string;
}

export interface LanJoinScreenProps {
  readonly onPaired: (payload: LanPairSuccess) => void | Promise<void>;
  readonly onOpenScanner?: () => Promise<string | null>;
  readonly pair: (args: {
    serverUrl: string;
    pairingToken: string;
    deviceId: string;
  }) => Promise<LanPairSuccess>;
  readonly deviceId: string;
  readonly testID?: string;
}

interface ParsedQr {
  readonly serverUrl: string;
  readonly pairingToken: string;
}

export function parseLanQrPayload(raw: string): ParsedQr | null {
  try {
    const trimmed = raw.trim();
    if (trimmed.length === 0) return null;
    const url = trimmed.startsWith('cachink-lan://')
      ? trimmed.replace('cachink-lan://', 'http://')
      : trimmed;
    const parsed = new URL(url);
    const token = parsed.searchParams.get('token');
    if (!token) return null;
    return {
      serverUrl: `http://${parsed.host}`,
      pairingToken: token,
    };
  } catch {
    return null;
  }
}

type T = ReturnType<typeof useTranslation>['t'];

interface JoinState {
  input: string;
  status: 'idle' | 'pairing' | 'error';
  errorMsg: string | null;
}

function buildRunPair(
  props: LanJoinScreenProps,
  setState: React.Dispatch<React.SetStateAction<JoinState>>,
) {
  return async (parsed: ParsedQr): Promise<void> => {
    setState((s) => ({ ...s, status: 'pairing', errorMsg: null }));
    try {
      const success = await props.pair({
        serverUrl: parsed.serverUrl,
        pairingToken: parsed.pairingToken,
        deviceId: props.deviceId,
      });
      await props.onPaired(success);
      setState((s) => ({ ...s, status: 'idle' }));
    } catch (err) {
      setState((s) => ({
        ...s,
        status: 'error',
        errorMsg: err instanceof Error ? err.message : String(err),
      }));
    }
  };
}

function useJoinController(props: LanJoinScreenProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<JoinState>({
    input: '',
    status: 'idle',
    errorMsg: null,
  });
  const setInput = (input: string) => setState((s) => ({ ...s, input }));
  const runPair = buildRunPair(props, setState);
  const setError = (msg: string) => setState((s) => ({ ...s, status: 'error', errorMsg: msg }));

  async function handleScan(): Promise<void> {
    const raw = props.onOpenScanner ? await props.onOpenScanner() : null;
    if (!raw) return;
    const parsed = parseLanQrPayload(raw);
    if (!parsed) return setError(t('lanPairing.invalidQr'));
    await runPair(parsed);
  }

  async function handlePaste(): Promise<void> {
    const parsed = parseLanQrPayload(state.input);
    if (!parsed) return setError(t('lanPairing.invalidUrl'));
    await runPair(parsed);
  }

  return { t, state, setInput, handleScan, handlePaste };
}

function PasteSection({
  t,
  input,
  status,
  setInput,
  handlePaste,
}: {
  t: T;
  input: string;
  status: JoinState['status'];
  setInput: (v: string) => void;
  handlePaste: () => Promise<void>;
}): ReactElement {
  return (
    <Card padding="md" fullWidth>
      <TextField
        label={t('lanPairing.pasteLabel')}
        value={input}
        onChange={setInput}
        placeholder="cachink-lan://192.168.1.5:43812?token=…"
        testID="lan-join-paste-input"
        returnKeyType="done"
        onSubmitEditing={handlePaste}
        blurOnSubmit
      />
      <View marginTop={12}>
        <Btn
          variant="dark"
          onPress={handlePaste}
          fullWidth
          testID="lan-join-paste-submit"
          disabled={status === 'pairing'}
        >
          {status === 'pairing' ? t('lanPairing.pairing') : t('lanPairing.pasteCta')}
        </Btn>
      </View>
    </Card>
  );
}

function JoinHeader({ t }: { t: T }): ReactElement {
  return (
    <>
      <SectionTitle title={t('lanPairing.joinTitle')} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={14}
        color={colors.gray600}
      >
        {t('lanPairing.joinSubtitle')}
      </Text>
    </>
  );
}

function ErrorLine({ msg }: { msg: string }): ReactElement {
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.semibold}
      fontSize={13}
      color={colors.red}
      testID="lan-join-error"
    >
      {msg}
    </Text>
  );
}

export function LanJoinScreen(props: LanJoinScreenProps): ReactElement {
  const { t, state, setInput, handleScan, handlePaste } = useJoinController(props);
  return (
    <View
      testID={props.testID ?? 'lan-join-screen'}
      flex={1}
      padding={20}
      gap={16}
      backgroundColor={colors.offwhite}
    >
      <JoinHeader t={t} />
      {props.onOpenScanner && (
        <Btn variant="primary" onPress={handleScan} fullWidth testID="lan-join-scan">
          {t('lanPairing.scanCta')}
        </Btn>
      )}
      <PasteSection
        t={t}
        input={state.input}
        status={state.status}
        setInput={setInput}
        handlePaste={handlePaste}
      />
      {state.status === 'error' && state.errorMsg && <ErrorLine msg={state.errorMsg} />}
    </View>
  );
}
