/**
 * Scanner — desktop (web) stub (Slice 2 C16). The real BarcodeDetector
 * + getUserMedia implementation lands in C17. For now this file
 * renders a manual-entry-only modal so the default export from
 * `./scanner.tsx` remains valid and Vite/Vitest resolve.
 *
 * Metro picks `./scanner.native.tsx` on mobile and never loads this
 * file.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Input, Modal } from '../index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import type { ScannerProps } from './scanner';

function ManualEntryBody({
  manual,
  setManual,
  onSubmit,
  onClose,
  t,
}: {
  manual: string;
  setManual: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <View gap={12} padding={12}>
      <Text color={colors.gray600}>{t('scanner.notSupported')}</Text>
      <Input
        label={t('scanner.manualLabel')}
        value={manual}
        onChange={setManual}
        testID="scanner-manual"
      />
      <Btn variant="primary" onPress={onSubmit} fullWidth testID="scanner-manual-submit">
        {t('scanner.manualEntry')}
      </Btn>
      <Btn variant="ghost" onPress={onClose} fullWidth testID="scanner-close">
        {t('scanner.close')}
      </Btn>
    </View>
  );
}

export function Scanner(props: ScannerProps): ReactElement {
  const { t } = useTranslation();
  const [manual, setManual] = useState('');
  const submit = (): void => {
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
      <ManualEntryBody
        manual={manual}
        setManual={setManual}
        onSubmit={submit}
        onClose={props.onClose}
        t={t}
      />
    </Modal>
  );
}
