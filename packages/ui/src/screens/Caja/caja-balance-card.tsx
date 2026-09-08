/**
 * CajaBalanceCard — live cash balance display for an open turn.
 *
 * Shows the total efectivo en caja and a breakdown of all contributing
 * amounts (apertura, ventas, cambios, egresos, depositos, retiros,
 * cancelaciones). Uses the pure `computeCajaBalance` domain function.
 */

import type { ReactElement } from 'react';
import { View, Text } from '@tamagui/core';
import { formatMoney, type Money } from '@cachink/domain';
import type { CajaBalanceResult } from '@cachink/domain';
import { Icon } from '../../components/Icon/index';
import { colors, fontSizes, radii, typography } from '../../theme';

export interface CajaBalanceCardProps {
  readonly balance: CajaBalanceResult;
  readonly testID?: string;
}

function Row(props: { label: string; amount: Money; prefix: '+' | '−' }): ReactElement {
  const isZero = props.amount === 0n;
  const color = isZero ? colors.textMuted : colors.ink;
  return (
    <View flexDirection="row" justifyContent="space-between" paddingVertical={2}>
      <Text fontFamily={typography.fontFamily} fontSize={fontSizes.md} color={color}>
        {props.label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold.toString()}
        fontSize={fontSizes.md}
        color={color}
      >
        {`${props.prefix} ${formatMoney(props.amount)}`}
      </Text>
    </View>
  );
}

export function CajaBalanceCard(props: CajaBalanceCardProps): ReactElement {
  const { desglose, efectivoEnCaja } = props.balance;

  return (
    <View
      backgroundColor={colors.yellowSoft}
      borderRadius={radii[2]}
      borderWidth={2}
      borderColor={colors.black}
      padding={16}
      gap={8}
      testID={props.testID ?? 'caja-balance-card'}
    >
      <BalanceTotalRow efectivoEnCaja={efectivoEnCaja} />
      <View height={1} backgroundColor={colors.gray200} marginVertical={4} />
      <BalanceBreakdown desglose={desglose} />
    </View>
  );
}

function BalanceTotalRow(props: { efectivoEnCaja: Money }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={8}>
      <Icon name="banknote" size={24} color={colors.greenText} />
      <View>
        <Text fontFamily={typography.fontFamily} fontSize={fontSizes.xs} color={colors.gray600}>
          Efectivo en caja
        </Text>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black.toString()}
          fontSize={fontSizes.xl4}
          color={colors.black}
        >
          {formatMoney(props.efectivoEnCaja)}
        </Text>
      </View>
    </View>
  );
}

function BalanceBreakdown(props: { desglose: CajaBalanceResult['desglose'] }): ReactElement {
  const d = props.desglose;
  return (
    <View>
      <Row label="Apertura:" amount={d.apertura} prefix="+" />
      {d.adicional > 0n && <Row label="Adicional:" amount={d.adicional} prefix="+" />}
      <Row label="Ventas efectivo:" amount={d.ventasEfectivo} prefix="+" />
      <Row label="Cambios dados:" amount={d.cambiosDados} prefix="−" />
      <Row label="Depósitos:" amount={d.depositos} prefix="+" />
      <Row label="Retiros:" amount={d.retiros} prefix="−" />
      <Row label="Egresos:" amount={d.egresosEfectivo} prefix="−" />
      <Row label="Cancelaciones:" amount={d.cancelacionesEfectivo} prefix="−" />
    </View>
  );
}
