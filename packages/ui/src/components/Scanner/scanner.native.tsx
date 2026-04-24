/**
 * Scanner — mobile (React Native) variant (ADR-022). Uses the
 * `CameraView` from `expo-camera` with `onBarcodeScanned` wired to
 * the shared `onScan(code)` prop. Metro auto-picks this file over
 * `./scanner.tsx` on RN.
 *
 * For single-shot mode the component tracks an internal `scanned`
 * flag to ignore duplicate frames after the first hit. Continuous
 * mode fires every frame; consumers that need debouncing wrap the
 * callback themselves.
 *
 * The CameraView is framed inside a Modal so the scanner inherits
 * the same dismiss UX (backdrop tap, Escape) as the rest of the app.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - expo-camera is a peer dep resolved by Metro at runtime
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Btn, Input, Modal } from '../index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import type { ScannerProps } from './scanner';

type T = ReturnType<typeof useTranslation>['t'];

function PermissionBanner({ onRequest, t }: { onRequest: () => void; t: T }): ReactElement {
  return (
    <View padding={16} gap={12}>
      <Text color={colors.red}>{t('scanner.permissionDenied')}</Text>
      <Btn variant="primary" onPress={onRequest} testID="scanner-permission">
        {t('actions.new')}
      </Btn>
    </View>
  );
}

function CameraBox({
  onScan,
  disabled,
}: {
  onScan: (arg: { data: string }) => void;
  disabled: boolean;
}): ReactElement {
  return (
    <View testID="scanner-camera" height={360} backgroundColor={colors.black}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'ean13', 'ean8', 'upc_a'] }}
        onBarcodeScanned={disabled ? undefined : onScan}
      />
    </View>
  );
}

function ScannerBody({
  permission,
  requestPermission,
  handleBarcode,
  disabled,
  t,
}: {
  permission: ReturnType<typeof useCameraPermissions>[0];
  requestPermission: () => Promise<unknown>;
  handleBarcode: (arg: { data: string }) => void;
  disabled: boolean;
  t: T;
}): ReactElement {
  if (!permission) return <Text>...</Text>;
  if (!permission.granted) {
    return <PermissionBanner onRequest={() => void requestPermission()} t={t} />;
  }
  return <CameraBox onScan={handleBarcode} disabled={disabled} />;
}

export function Scanner(props: ScannerProps): ReactElement {
  const { t } = useTranslation();
  const mode = props.mode ?? 'single';
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleBarcode = ({ data }: { data: string }): void => {
    if (mode === 'single' && scanned) return;
    setScanned(true);
    props.onScan(data);
    if (mode === 'single') props.onClose();
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('scanner.title')}
      testID="scanner-modal"
    >
      {props.header}
      <ScannerBody
        permission={permission}
        requestPermission={requestPermission}
        handleBarcode={handleBarcode}
        disabled={scanned && mode === 'single'}
        t={t}
      />
      <ManualEntry
        onSubmit={(code) => {
          props.onScan(code);
          if (mode === 'single') props.onClose();
        }}
        t={t}
      />
      <Btn variant="ghost" onPress={props.onClose} fullWidth testID="scanner-close">
        {t('scanner.close')}
      </Btn>
    </Modal>
  );
}

function ManualEntry({ onSubmit, t }: { onSubmit: (code: string) => void; t: T }): ReactElement {
  const [value, setValue] = useState('');
  return (
    <View gap={8} marginTop={8}>
      <Input
        label={t('scanner.manualLabel')}
        value={value}
        onChange={setValue}
        testID="scanner-manual"
      />
      <Btn
        variant="soft"
        onPress={() => {
          if (!value.trim()) return;
          onSubmit(value.trim());
          setValue('');
        }}
        fullWidth
        testID="scanner-manual-submit"
      >
        {t('scanner.manualEntry')}
      </Btn>
    </View>
  );
}
