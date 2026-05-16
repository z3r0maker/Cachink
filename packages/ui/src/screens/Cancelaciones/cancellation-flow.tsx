/**
 * CancellationFlow — multi-step cancellation: PIN → reason → cash confirm.
 *
 * Orchestrates the PIN gate, reason input, and cash return confirmation
 * for a single sale cancellation.
 */

import { useState, useCallback, type ReactElement } from 'react';
import { Alert } from 'react-native';
import { Text, View } from '@tamagui/core';
import {
  formatMoney,
  type BusinessId,
  type Sale,
  type UserId,
} from '@cachink/domain';
import { Modal } from '../../components/index';
import { Btn } from '../../components/Btn/btn';
import { Input } from '../../components/Input/index';
import { PinCodeInput } from '../../components/index';
import { useSalesRepository, useCancelacionLogsRepository } from '../../app/repository-provider';
import { useCurrentBusinessId, useUserId } from '../../app-config/use-app-config';
import { colors, typography } from '../../theme';

type Step = 'pin' | 'reason' | 'cash-confirm' | 'done';

export interface CancellationFlowProps {
  readonly sale: Sale;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

export function CancellationFlow(
  props: CancellationFlowProps,
): ReactElement {
  const [step, setStep] = useState<Step>('pin');
  const [_pin, setPin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const userId = useUserId() as UserId;
  const businessId = useCurrentBusinessId() as BusinessId;
  const salesRepo = useSalesRepository();
  const logsRepo = useCancelacionLogsRepository();

  const isCashSale = props.sale.metodo === 'Efectivo';

  const handlePinSubmit = useCallback((enteredPin: string) => {
    setPin(enteredPin);
    setStep('reason');
  }, []);

  const handleReasonSubmit = useCallback(() => {
    if (motivo.trim().length === 0) return;
    if (isCashSale) {
      setStep('cash-confirm');
    } else {
      executeCancellation();
    }
  }, [motivo, isCashSale]);

  const executeCancellation = useCallback(async () => {
    setSubmitting(true);
    try {
      // Soft-delete the sale
      await salesRepo.delete(props.sale.id);

      // Create audit log
      await logsRepo.create({
        saleId: props.sale.id,
        cancelledByUserId: userId,
        motivo: motivo.trim(),
        montoOriginalCentavos: props.sale.monto,
        metodoOriginal: props.sale.metodo,
        cashReturnedCentavos: isCashSale ? props.sale.monto : null,
        stockReversed: false, // Stock reversal handled by use case
        cantidadDevuelta: null,
        productoId: null,
        businessId,
      });

      props.onSuccess();
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [salesRepo, logsRepo, props, userId, businessId, motivo, isCashSale]);

  return (
    <Modal
      open
      onClose={props.onClose}
      title="Cancelar venta"
      testID="cancellation-flow"
    >
      {step === 'pin' && (
        <PinStep onSubmit={handlePinSubmit} onCancel={props.onClose} />
      )}
      {step === 'reason' && (
        <ReasonStep
          motivo={motivo}
          onChangeMotivo={setMotivo}
          onSubmit={handleReasonSubmit}
        />
      )}
      {step === 'cash-confirm' && (
        <CashConfirmStep
          amount={props.sale.monto}
          onConfirm={executeCancellation}
          submitting={submitting}
        />
      )}
    </Modal>
  );
}

// --- Sub-components ---

function PinStep(props: {
  onSubmit: (pin: string) => void;
  onCancel: () => void;
}): ReactElement {
  const [pinValue, setPinValue] = useState('');
  return (
    <View gap={16} alignItems="center" padding={8}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold.toString()}
        fontSize={16}
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

function ReasonStep(props: {
  motivo: string;
  onChangeMotivo: (v: string) => void;
  onSubmit: () => void;
}): ReactElement {
  return (
    <View gap={16} padding={8}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold.toString()}
        fontSize={16}
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

function CashConfirmStep(props: {
  amount: bigint;
  onConfirm: () => void;
  submitting: boolean;
}): ReactElement {
  return (
    <View gap={16} padding={8} alignItems="center">
      <Text fontSize={40}>💵</Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black.toString()}
        fontSize={24}
        color={colors.black}
        textAlign="center"
      >
        {`Devuelve ${formatMoney(props.amount)} al cliente`}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontSize={14}
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
        ✅ Confirmar devolución
      </Btn>
    </View>
  );
}
