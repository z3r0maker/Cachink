/**
 * Display-only parts of the CorteDeDia modal: LineItem + EsperadoCard +
 * DiferenciaCard. Kept in a separate file to let `corte-modal.tsx` stay
 * under the 200-line hard budget (CLAUDE.md §4.4).
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { ZERO, formatMoney, type Money } from '@cachink/domain';
import { Card } from '../../components/index';
import type { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export type DiferenciaTone = 'neutral' | 'positive' | 'negative';

interface LineItemProps {
  readonly label: string;
  readonly value: string;
  readonly tone?: DiferenciaTone;
  readonly testID?: string;
}

export function LineItem(props: LineItemProps): ReactElement {
  const tone = props.tone ?? 'neutral';
  const valueColor =
    tone === 'positive' ? colors.green : tone === 'negative' ? colors.red : colors.black;
  return (
    <View
      testID={props.testID}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingVertical={8}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={12}
        color={colors.gray600}
        letterSpacing={typography.letterSpacing.wide}
        style={{ textTransform: 'uppercase' }}
      >
        {props.label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={20}
        color={valueColor}
      >
        {props.value}
      </Text>
    </View>
  );
}

export function diferenciaTone(diferencia: Money): DiferenciaTone {
  if (diferencia === ZERO) return 'neutral';
  return diferencia > ZERO ? 'positive' : 'negative';
}

type T = ReturnType<typeof useTranslation>['t'];

export function EsperadoCard({ esperado, t }: { esperado: Money; t: T }): ReactElement {
  return (
    <Card variant="white" padding="md" fullWidth testID="corte-esperado-card">
      <LineItem
        label={t('corteDeDia.esperadoLabel')}
        value={formatMoney(esperado)}
        testID="corte-esperado-row"
      />
    </Card>
  );
}

export function DiferenciaCard({ diferencia, t }: { diferencia: Money; t: T }): ReactElement {
  return (
    <Card variant="yellow" padding="md" fullWidth testID="corte-diferencia-card">
      <LineItem
        label={t('corteDeDia.diferenciaLabel')}
        value={formatMoney(diferencia)}
        tone={diferenciaTone(diferencia)}
        testID="corte-diferencia-row"
      />
    </Card>
  );
}
