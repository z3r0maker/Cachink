/**
 * IsrDisclaimer — small yellow card appended to the Estado de
 * Resultados + Indicadores screens (P1C-M8-T06, Slice 3 C18).
 *
 * Plain copy — reminds the user the ISR figure is referential and
 * directs them to their contador. Optional tap handler so the parent
 * can route to Settings (where the ISR tasa can be adjusted).
 *
 * UX audit Issue 2 + 9: now shows a contextual explanation when ISR
 * is $0 due to a loss, and the settings button displays the current rate.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface IsrDisclaimerProps {
  readonly onOpenSettings?: () => void;
  /** ISR rate as a decimal (0.30 → displays "30%"). */
  readonly isrRate?: number;
  /** True when ISR is $0 because utilidadOperativa ≤ 0. */
  readonly isrIsZeroDueToLoss?: boolean;
  readonly testID?: string;
}

function SettingsRow({
  onOpenSettings,
  label,
}: {
  onOpenSettings: () => void;
  label: string;
}): ReactElement {
  return (
    <View flexDirection="row" justifyContent="flex-end" marginTop={10}>
      <Btn variant="ghost" size="sm" onPress={onOpenSettings} testID="isr-disclaimer-settings">
        {label}
      </Btn>
    </View>
  );
}

export function IsrDisclaimer(props: IsrDisclaimerProps): ReactElement {
  const { t } = useTranslation();
  const ratePercent = props.isrRate !== undefined ? Math.round(props.isrRate * 100) : undefined;
  const title =
    ratePercent !== undefined
      ? t('estados.isrDisclaimerTitleWithRate', { rate: String(ratePercent) })
      : t('estados.isrDisclaimerTitle');
  const body =
    props.isrIsZeroDueToLoss === true && ratePercent !== undefined
      ? t('estados.isrDisclaimerZeroExplain', { rate: String(ratePercent) })
      : t('estados.isrDisclaimerBody');
  const settingsLabel =
    ratePercent !== undefined
      ? t('estados.isrDisclaimerSettingsLabel', { rate: String(ratePercent) })
      : t('tabs.ajustes');
  return (
    <Card
      testID={props.testID ?? 'isr-disclaimer'}
      variant="yellow"
      elevation="raised"
      padding="md"
      fullWidth
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={14}
        color={colors.black}
      >
        {title}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.ink}
        marginTop={4}
      >
        {body}
      </Text>
      {props.onOpenSettings !== undefined && (
        <SettingsRow onOpenSettings={props.onOpenSettings} label={settingsLabel} />
      )}
    </Card>
  );
}
