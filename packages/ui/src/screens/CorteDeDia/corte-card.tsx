/**
 * CorteDeDiaCard — yellow Card that appears on the Operativo home after
 * 18:00 local time (P1C-M7-T01). Tapping the CTA opens the corte modal;
 * the parent wires the handler.
 *
 * Pure presentation — visibility is driven by props so the card stays
 * testable without faking the clock. The parent wires `useCorteGate`
 * and `useCorteDelDia` to decide `shouldShow`.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface CorteDeDiaCardProps {
  /** When false, renders nothing. */
  readonly shouldShow: boolean;
  readonly onOpen: () => void;
  readonly testID?: string;
}

export function CorteDeDiaCard(props: CorteDeDiaCardProps): ReactElement | null {
  const { t } = useTranslation();
  if (!props.shouldShow) return null;
  return (
    <Card testID={props.testID ?? 'corte-de-dia-card'} variant="yellow" padding="md" fullWidth>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={20}
        color={colors.black}
        letterSpacing={typography.letterSpacing.tighter}
      >
        {t('corteDeDia.cardTitle')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={14}
        color={colors.ink}
        marginTop={6}
        marginBottom={12}
      >
        {t('corteDeDia.cardBody')}
      </Text>
      <View flexDirection="row" justifyContent="flex-end">
        <Btn variant="dark" onPress={props.onOpen} testID="corte-de-dia-cta">
          {t('corteDeDia.cta')}
        </Btn>
      </View>
    </Card>
  );
}
