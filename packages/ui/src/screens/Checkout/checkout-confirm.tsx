/**
 * CheckoutConfirm — shared confirmation screen for card/transfer/QR.
 *
 * Simple 1-tap confirmation: shows the total, payment method description,
 * and a big "confirm" button. Used for Tarjeta, Transferencia, and QR/CoDi.
 */

import type { ReactElement } from 'react';
import { View, Text } from '@tamagui/core';
import { formatMoney, type Money, type PaymentMethod } from '@cachink/domain';
import { Btn } from '../../components/Btn/btn';
import { Icon, type IconName } from '../../components/Icon/index';
import { colors, radii, typography } from '../../theme';

export interface CheckoutConfirmProps {
  readonly totalCentavos: Money;
  readonly metodo: PaymentMethod;
  readonly onConfirm: () => void;
  readonly submitting?: boolean;
  readonly testID?: string;
}

interface MethodConfig {
  readonly icon: IconName;
  readonly title: string;
  readonly message: string;
  readonly buttonLabel: string;
}

function getMethodConfig(metodo: PaymentMethod): MethodConfig {
  switch (metodo) {
    case 'Tarjeta':
      return {
        icon: 'credit-card',
        title: 'Tarjeta de crédito/débito',
        message: 'Confirma que el cobro con tarjeta fue exitoso',
        buttonLabel: 'Cobro confirmado',
      };
    case 'Transferencia':
      return {
        icon: 'wallet',
        title: 'Transferencia (SPEI)',
        message: 'Confirma que recibiste la transferencia',
        buttonLabel: 'Transferencia recibida',
      };
    case 'QR/CoDi':
      return {
        icon: 'smartphone',
        title: 'QR / CoDi',
        message: 'Confirma que el pago fue recibido',
        buttonLabel: 'Pago recibido',
      };
    default:
      return {
        icon: 'banknote',
        title: metodo,
        message: 'Confirma el pago',
        buttonLabel: 'Confirmar pago',
      };
  }
}

function MethodBadge(props: { icon: IconName }): ReactElement {
  return (
    <View
      backgroundColor={colors.yellowSoft}
      borderRadius={radii[5]}
      borderWidth={2}
      borderColor={colors.black}
      padding={20}
    >
      <Icon name={props.icon} size={48} color={colors.black} />
    </View>
  );
}

function ConfirmHeader(props: {
  icon: IconName;
  totalCentavos: Money;
  title: string;
  message: string;
}): ReactElement {
  return (
    <>
      <MethodBadge icon={props.icon} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black.toString()}
        fontSize={32}
        color={colors.black}
        textAlign="center"
      >
        {formatMoney(props.totalCentavos)}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold.toString()}
        fontSize={18}
        color={colors.gray600}
        textAlign="center"
      >
        {props.title}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontSize={16}
        color={colors.gray400}
        textAlign="center"
      >
        {props.message}
      </Text>
    </>
  );
}

export function CheckoutConfirm(
  props: CheckoutConfirmProps,
): ReactElement {
  const config = getMethodConfig(props.metodo);

  return (
    <View
      flex={1}
      padding={24}
      gap={24}
      alignItems="center"
      justifyContent="center"
      testID={props.testID ?? `checkout-confirm-${props.metodo}`}
    >
      <ConfirmHeader
        icon={config.icon}
        totalCentavos={props.totalCentavos}
        title={config.title}
        message={config.message}
      />
      <View width="100%" paddingTop={12}>
        <Btn
          variant="green"
          fullWidth
          size="lg"
          icon={<Icon name="check" size={18} color={colors.white} />}
          onPress={props.onConfirm}
          loading={props.submitting === true}
          testID={`checkout-confirm-${props.metodo}-submit`}
        >
          {config.buttonLabel}
        </Btn>
      </View>
    </View>
  );
}
