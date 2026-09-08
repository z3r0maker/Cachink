/**
 * Cancellation step sub-components — extracted from cancellation-flow.tsx.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatMoney } from '@cachink/domain';
import { Btn } from '../../components/Btn/btn';
import { Input } from '../../components/Input/index';
import { PinCodeInput } from '../../components/index';
import { colors, emojiSizes, fontSizes, typography } from '../../theme';

export function PinStep(props: { onSubmit: (pin: string) => void }): ReactElement {
  const [pinValue, setPinValue] = useState('');
  return (
    <View gap={16} alignItems="center" padding={8}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold.toString()}
        fontSize={fontSizes.lg}
        color={colors.gray600}
        textAlign="center"
      >
        Ingresa tu PIN para autorizar la cancelación
      </Text>
      <PinCodeInput
        value={pinValue}
        onChange={setPinValue}
        onComplete={props.onSubmit}
        testID="cancel-pin-input"
      />
    </View>
  );
}

export function ReasonStep(props: {
  motivo: string;
  onChangeMotivo: (v: string) => void;
  onSubmit: () => void;
}): ReactElement {
  return (
    <View gap={16} padding={8}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold.toString()}
        fontSize={fontSizes.lg}
        color={colors.gray600}
      >
        ¿Por qué cancelas esta venta?
      </Text>
      <Input
        label="Motivo"
        value={props.motivo}
        onChange={props.onChangeMotivo}
        placeholder="Cliente cambió de opinión"
        testID="cancel-reason-input"
      />
      <Btn
        variant="danger"
        fullWidth
        onPress={props.onSubmit}
        disabled={props.motivo.trim().length === 0}
        testID="cancel-reason-submit"
      >
        Continuar
      </Btn>
    </View>
  );
}

export function CashConfirmStep(props: {
  amount: bigint;
  onConfirm: () => void;
  submitting: boolean;
}): ReactElement {
  return (
    <View gap={16} padding={8} alignItems="center">
      <Text fontSize={emojiSizes.md}>💵</Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black.toString()}
        fontSize={fontSizes.xl3}
        color={colors.black}
        textAlign="center"
      >
        {`Devuelve ${formatMoney(props.amount)} al cliente`}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontSize={fontSizes.md}
        color={colors.gray600}
        textAlign="center"
      >
        El efectivo será descontado del saldo de la caja.
      </Text>
      <Btn
        variant="danger"
        fullWidth
        size="lg"
        onPress={props.onConfirm}
        loading={props.submitting}
        testID="cancel-cash-confirm"
      >
        Confirmar devolución
      </Btn>
    </View>
  );
}
