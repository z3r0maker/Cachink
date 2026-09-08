/**
 * EgresoCard — one row in the Egresos list.
 *
 * Shows concepto, categoria Tag, proveedor label (if set), monto.
 * Tapping opens the parent's detail popover.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Expense } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Card, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';

export interface EgresoCardProps {
  readonly egreso: Expense;
  readonly onPress?: () => void;
  readonly testID?: string;
}

function CategoriaTag({ categoria }: { categoria: Expense['categoria'] }): ReactElement {
  const variant = categoria === 'Nómina' ? 'info' : categoria === 'Inventario' ? 'soft' : 'neutral';
  return <Tag variant={variant}>{categoria}</Tag>;
}

export function EgresoCard(props: EgresoCardProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Card
      testID={props.testID ?? `egreso-card-${props.egreso.id}`}
      padding="md"
      onPress={props.onPress}
      fullWidth
    >
      <View flexDirection="row" alignItems="center" justifyContent="space-between">
        <View flex={1} paddingRight={12}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={fontSizes.lg}
            color={colors.black}
          >
            {props.egreso.concepto}
          </Text>
          <View flexDirection="row" gap={6} marginTop={6}>
            <CategoriaTag categoria={props.egreso.categoria} />
            <Tag variant="neutral">{props.egreso.proveedor ?? t('egresos.sinProveedor')}</Tag>
          </View>
        </View>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={fontSizes.xl2}
          color={colors.redText}
        >
          −{formatMoney(props.egreso.monto)}
        </Text>
      </View>
    </Card>
  );
}
