/**
 * IsrDisclaimer — small yellow card appended to the Estado de
 * Resultados + Indicadores screens (P1C-M8-T06, Slice 3 C18).
 *
 * Plain copy — reminds the user the ISR figure is referential and
 * directs them to their contador. Optional tap handler so the parent
 * can route to Settings (where the ISR tasa can be adjusted).
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface IsrDisclaimerProps {
  readonly onOpenSettings?: () => void;
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
  return (
    <Card testID={props.testID ?? 'isr-disclaimer'} variant="yellow" padding="md" fullWidth>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={14}
        color={colors.black}
      >
        {t('estados.isrDisclaimerTitle')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.ink}
        marginTop={4}
      >
        {t('estados.isrDisclaimerBody')}
      </Text>
      {props.onOpenSettings !== undefined && (
        <SettingsRow onOpenSettings={props.onOpenSettings} label={t('tabs.ajustes')} />
      )}
    </Card>
  );
}
