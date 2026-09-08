/**
 * TotalBar — compact single-row yellow Card that replaces SessionStrip.
 *
 * Shows "TOTAL DEL DÍA" + ventaCount on the left, formatted total on
 * the right. When `showCorte` is true the left side switches to a
 * "Cierre del día" CTA so the operator can close the cash register.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Money } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Btn, Card } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';
import { impactLight } from '../../haptics/index';

export interface TotalBarProps {
  readonly total: Money;
  readonly ventaCount: number;
  readonly showCorte?: boolean;
  readonly onCorteOpen?: () => void;
  readonly testID?: string;
}

function CorteLeft(props: { onCorteOpen: () => void }): ReactElement {
  const { t } = useTranslation();
  return (
    <View flex={1} gap={2}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={fontSizes.md}
        color={colors.black}
      >
        {t('corteDeDia.cardTitle')}
      </Text>
      <View flexDirection="row" alignItems="center" gap={8}>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={fontSizes.xs}
          color={colors.ink}
        >
          {t('corteDeDia.cardBody')}
        </Text>
        <Btn
          variant="dark"
          size="sm"
          onPress={() => {
            impactLight();
            props.onCorteOpen();
          }}
          testID="total-bar-corte-cta"
        >
          {t('corteDeDia.ctaShort')}
        </Btn>
      </View>
    </View>
  );
}

function NormalLeft(props: { ventaCount: number }): ReactElement {
  return (
    <View flex={1} gap={2}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.xs}
        color={colors.black}
        letterSpacing={typography.letterSpacing.wide}
        textTransform="uppercase"
      >
        Total del día
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.xs}
        color={colors.gray600}
      >
        {props.ventaCount} venta{props.ventaCount !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

export function TotalBar(props: TotalBarProps): ReactElement {
  return (
    <Card
      variant="yellow"
      padding="md"
      fullWidth
      testID={props.testID ?? 'total-bar'}
      ariaLabel="Total del día"
    >
      <View flexDirection="row" justifyContent="space-between" alignItems="center">
        {props.showCorte === true && props.onCorteOpen ? (
          <CorteLeft onCorteOpen={props.onCorteOpen} />
        ) : (
          <NormalLeft ventaCount={props.ventaCount} />
        )}
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={fontSizes.xl2}
          color={colors.black}
          letterSpacing={typography.letterSpacing.tight}
        >
          {formatMoney(props.total)}
        </Text>
      </View>
    </Card>
  );
}
