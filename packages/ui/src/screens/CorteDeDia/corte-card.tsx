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
    <Card
      testID={props.testID ?? 'corte-de-dia-card'}
      variant="yellow"
      elevation="none"
      padding="sm"
      fullWidth
    >
      <View flexDirection="row" justifyContent="space-between" alignItems="center" gap={12}>
        <View flex={1}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.black}
            fontSize={16}
            color={colors.black}
            letterSpacing={typography.letterSpacing.tighter}
          >
            {t('corteDeDia.cardTitle')}
          </Text>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.medium}
            fontSize={12}
            color={colors.ink}
            marginTop={2}
          >
            {t('corteDeDia.cardBody')}
          </Text>
        </View>
        <Btn variant="dark" size="sm" onPress={props.onOpen} testID="corte-de-dia-cta">
          {t('corteDeDia.ctaShort')}
        </Btn>
      </View>
    </Card>
  );
}
