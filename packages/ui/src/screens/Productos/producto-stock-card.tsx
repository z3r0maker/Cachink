/**
 * StockActionCard + helpers — extracted from producto-detail-fields
 * to keep that file under 200 lines.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Icon } from '../../components/index';
import { colors, fontSizes, typography } from '../../theme';

function stockStatus(stock: number, umbral: number) {
  const isLow = stock <= umbral;
  if (stock <= 0) return { bg: colors.redSoft, fg: colors.red, label: 'Sin stock' };
  if (isLow) return { bg: colors.warningSoft, fg: colors.warning, label: 'Bajo' };
  return { bg: colors.greenSoft, fg: colors.green, label: 'Saludable' };
}

function StockActions(props: { onEntrada: () => void; onSalida: () => void }): ReactElement {
  return (
    <View flexDirection="row" gap={8}>
      <View flex={1}>
        <Btn
          variant="green"
          onPress={props.onEntrada}
          fullWidth
          testID="detail-entrada"
          icon={<Icon name="plus" size={16} color={colors.white} />}
        >
          Entrada
        </Btn>
      </View>
      <View flex={1}>
        <Btn
          variant="primary"
          onPress={props.onSalida}
          fullWidth
          testID="detail-salida"
          icon={<Icon name="minus" size={16} color={colors.black} />}
        >
          Salida
        </Btn>
      </View>
    </View>
  );
}

function StockBadge(props: { bg: string; fg: string; label: string }): ReactElement {
  return (
    <View backgroundColor={props.bg} paddingHorizontal={10} paddingVertical={4} borderRadius={8}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.xs}
        color={props.fg}
      >
        {props.label}
      </Text>
    </View>
  );
}

function StockQuantityRow(props: {
  stock: number;
  s: ReturnType<typeof stockStatus>;
}): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={12}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={fontSizes.xl4}
        color={colors.black}
      >
        {props.stock}
      </Text>
      <StockBadge bg={props.s.bg} fg={props.s.fg} label={props.s.label} />
    </View>
  );
}

type T = (key: string) => string;

/** Stock + Entrada / Salida card. */
export function StockActionCard(props: {
  stock: number;
  umbral: number;
  onEntrada: () => void;
  onSalida: () => void;
  t: T;
}): ReactElement {
  const s = stockStatus(props.stock, props.umbral);
  return (
    <View
      backgroundColor={colors.white}
      borderWidth={2}
      borderColor={colors.black}
      borderRadius={14}
      padding={16}
      gap={12}
    >
      <StockQuantityRow stock={props.stock} s={s} />
      <StockActions onEntrada={props.onEntrada} onSalida={props.onSalida} />
    </View>
  );
}
