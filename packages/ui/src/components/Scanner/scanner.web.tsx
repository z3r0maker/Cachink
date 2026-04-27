/**
 * Scanner — desktop / web variant (Slice 2 C17, ADR-022).
 *
 * Uses BarcodeDetector + getUserMedia on supported browsers
 * (Chromium 86+, Tauri Windows webview). Safari / macOS WebKit
 * doesn't expose BarcodeDetector — on those browsers
 * `useBarcodeDetector` returns status='unavailable' and this file
 * falls back to a manual-entry input. Manual entry is also always
 * accessible via the "Ingresar código manualmente" Btn.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn } from '../Btn/index';
import { Input } from '../Input/index';
import { Modal } from '../Modal/index';
import { useTranslation } from '../../i18n/index';
import { colors, radii } from '../../theme';
import type { ScannerProps } from './scanner';
import { useBarcodeDetector, type ScannerStatus } from './use-barcode-detector';

type T = ReturnType<typeof useTranslation>['t'];

function ManualEntryBody({
  manual,
  setManual,
  onSubmit,
  t,
}: {
  manual: string;
  setManual: (v: string) => void;
  onSubmit: () => void;
  t: T;
}): ReactElement {
  return (
    <View gap={8} padding={12}>
      <Input
        label={t('scanner.manualLabel')}
        value={manual}
        onChange={setManual}
        testID="scanner-manual"
      />
      <Btn variant="primary" onPress={onSubmit} fullWidth testID="scanner-manual-submit">
        {t('scanner.manualEntry')}
      </Btn>
    </View>
  );
}

function CameraVideo({
  videoRef,
}: {
  videoRef: (el: HTMLVideoElement | null) => void;
}): ReactElement {
  return (
    <View
      testID="scanner-camera"
      height={320}
      backgroundColor={colors.black}
      borderRadius={radii[1]}
      style={{ overflow: 'hidden' }}
    >
      <video
        ref={videoRef}
        data-testid="scanner-video"
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </View>
  );
}

function CameraSurface({
  videoRef,
  status,
  t,
}: {
  videoRef: (el: HTMLVideoElement | null) => void;
  status: ScannerStatus;
  t: T;
}): ReactElement {
  if (status === 'unavailable') {
    return (
      <Text padding={12} color={colors.gray600}>
        {t('scanner.notSupported')}
      </Text>
    );
  }
  if (status === 'denied') {
    return (
      <Text padding={12} color={colors.red}>
        {t('scanner.permissionDenied')}
      </Text>
    );
  }
  return <CameraVideo videoRef={videoRef} />;
}

export function Scanner(props: ScannerProps): ReactElement {
  const { t } = useTranslation();
  const [manual, setManual] = useState('');
  const detector = useBarcodeDetector(props.open, (code) => {
    props.onScan(code);
    if ((props.mode ?? 'single') === 'single') props.onClose();
  });

  const submitManual = (): void => {
    if (!manual.trim()) return;
    props.onScan(manual.trim());
    setManual('');
    if ((props.mode ?? 'single') === 'single') props.onClose();
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('scanner.title')}
      testID="scanner-modal"
    >
      {props.header}
      <CameraSurface videoRef={detector.videoRef} status={detector.status} t={t} />
      <ManualEntryBody manual={manual} setManual={setManual} onSubmit={submitManual} t={t} />
      <Btn variant="ghost" onPress={props.onClose} fullWidth testID="scanner-close">
        {t('scanner.close')}
      </Btn>
    </Modal>
  );
}
