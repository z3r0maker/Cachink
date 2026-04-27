/**
 * ConsentModal — first-launch opt-in for crash reporting (ADR-027,
 * P1C-M12-T02, S4-C15).
 *
 * Rendered once at boot when `crashReportingEnabled` is `null`. Three
 * outcomes:
 *   - Sí              → onChange(true)   (persist + init Sentry)
 *   - No, gracias     → onChange(false)  (persist; Sentry never inits)
 *   - Decidir después → onChange(null)   (stay null; modal re-appears
 *                                          next cold-start)
 *
 * Pure UI: parent wires the repository write + state setter.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Modal } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface ConsentModalProps {
  readonly open: boolean;
  readonly onChange: (next: boolean | null) => void;
  readonly testID?: string;
}

function ChoiceRow(props: {
  onChange: (next: boolean | null) => void;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <View flexDirection="row" gap={8} flexWrap="wrap">
      <Btn variant="green" onPress={() => props.onChange(true)} testID="consent-modal-yes">
        {props.t('settings.crashReportingYes')}
      </Btn>
      <Btn variant="ghost" onPress={() => props.onChange(false)} testID="consent-modal-no">
        {props.t('settings.crashReportingNo')}
      </Btn>
      <Btn variant="ghost" onPress={() => props.onChange(null)} testID="consent-modal-later">
        {props.t('settings.crashReportingLater')}
      </Btn>
    </View>
  );
}

export function ConsentModal(props: ConsentModalProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Modal
      open={props.open}
      onClose={() => props.onChange(null)}
      title={t('settings.crashReportingTitle')}
      testID={props.testID ?? 'consent-modal'}
    >
      <View gap={12}>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={14}
          color={colors.gray600}
        >
          {t('settings.crashReportingBody')}
        </Text>
        <ChoiceRow onChange={props.onChange} t={t} />
      </View>
    </Modal>
  );
}
