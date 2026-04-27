/**
 * ConfirmModeChangeModal — shown right before the wizard fires
 * `onSelectMode` for a re-run path that involves something
 * irreversible-feeling (sign-in, QR scan). Skipped on first-run and
 * when the new mode is `local` (no sign-in / pairing involved).
 *
 * The confirm button text dynamically interpolates the new mode name
 * from `wizard.modeNames.*` so the user sees exactly what they're
 * switching to.
 */

import type { ReactElement } from 'react';
import { Text } from '@tamagui/core';
import { Btn, Modal } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import type { AppMode } from '../../app-config/index';

export interface ConfirmModeChangeModalProps {
  readonly open: boolean;
  readonly mode: AppMode;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

const MODE_LABEL_KEY: Record<AppMode, 'local' | 'cloud' | 'lanServer' | 'lanClient'> = {
  local: 'local',
  cloud: 'cloud',
  'lan-server': 'lanServer',
  'lan-client': 'lanClient',
};

function ConfirmBody({
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}): ReactElement {
  return (
    <>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={14}
        color={colors.ink}
        marginBottom={16}
      >
        {body}
      </Text>
      <Btn
        variant="primary"
        onPress={onConfirm}
        fullWidth
        testID="wizard-confirm-mode-change-confirm"
      >
        {confirmLabel}
      </Btn>
      <Btn variant="ghost" onPress={onCancel} fullWidth testID="wizard-confirm-mode-change-cancel">
        {cancelLabel}
      </Btn>
    </>
  );
}

export function ConfirmModeChangeModal(props: ConfirmModeChangeModalProps): ReactElement {
  const { t } = useTranslation();
  const labelKey = MODE_LABEL_KEY[props.mode];
  const modoName = t(`wizard.modeNames.${labelKey}` as 'wizard.modeNames.local');
  return (
    <Modal
      open={props.open}
      onClose={props.onCancel}
      title={t('wizard.confirmModeChange.title', { modo: modoName })}
      testID="wizard-confirm-mode-change"
    >
      <ConfirmBody
        body={t('wizard.confirmModeChange.body')}
        confirmLabel={t('wizard.confirmModeChange.confirmCta', { modo: modoName })}
        cancelLabel={t('wizard.cancel')}
        onConfirm={props.onConfirm}
        onCancel={props.onCancel}
      />
    </Modal>
  );
}
