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
import { colors, radii, typography } from '../../theme';

export interface CajaBalanceCardProps {
  readonly balance: CajaBalanceResult;
  readonly testID?: string;
}

function Row(props: {
  label: string;
  amount: Money;
  prefix: '+' | '−';
}): ReactElement {
  const isZero = props.amount === 0n;
  return (
    <View flexDirection="row" justifyContent="space-between" paddingVertical={2}>
      <Text
        fontFamily={typography.fontFamily}
        fontSize={14}
        color={isZero ? colors.gray400 : colors.ink}
      >
        {props.label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold.toString()}
        fontSize={14}
        color={isZero ? colors.gray400 : colors.ink}
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
      <View flexDirection="row" alignItems="center" gap={8}>
        <Icon name="banknote" size={24} color={colors.green} />
        <View>
          <Text
            fontFamily={typography.fontFamily}
            fontSize={12}
            color={colors.gray600}
          >
            Efectivo en caja
          </Text>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.black.toString()}
            fontSize={28}
            color={colors.black}
          >
            {formatMoney(efectivoEnCaja)}
          </Text>
        </View>
      </View>

      <View
        height={1}
        backgroundColor={colors.gray200}
        marginVertical={4}
      />

      <Row label="Apertura:" amount={desglose.apertura} prefix="+" />
      {desglose.adicional > 0n && (
        <Row label="Adicional:" amount={desglose.adicional} prefix="+" />
      )}
      <Row label="Ventas efectivo:" amount={desglose.ventasEfectivo} prefix="+" />
      <Row label="Cambios dados:" amount={desglose.cambiosDados} prefix="−" />
      <Row label="Depósitos:" amount={desglose.depositos} prefix="+" />
      <Row label="Retiros:" amount={desglose.retiros} prefix="−" />
      <Row label="Egresos:" amount={desglose.egresosEfectivo} prefix="−" />
      <Row label="Cancelaciones:" amount={desglose.cancelacionesEfectivo} prefix="−" />
    </View>
  );
}
