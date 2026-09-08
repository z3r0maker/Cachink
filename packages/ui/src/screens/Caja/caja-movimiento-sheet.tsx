/**
 * CajaMovimientoSheet — bottom sheet for deposit/withdraw cash.
 *
 * Uses the Numpad component + a motivo text field. Reused for both
 * "Agregar efectivo" (deposito) and "Retirar efectivo" (retiro).
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { CajaMovimientoTipo, Money } from '@cachink/domain';
import { ZERO } from '@cachink/domain';
import { Btn, Modal } from '../../components/index';
import { Icon } from '../../components/Icon/index';
import { Input } from '../../components/Input/index';
import { Numpad, NumpadDisplay, useNumpadInput } from '../../components/Numpad/index';
import { colors, fontSizes, typography } from '../../theme';

export interface CajaMovimientoSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly tipo: CajaMovimientoTipo;
  readonly onSubmit: (montoCentavos: Money, motivo: string) => void;
  readonly submitting?: boolean;
  readonly testID?: string;
}

function movLabels(isDeposito: boolean): { title: string; question: string; btn: string } {
  return {
    title: isDeposito ? 'Agregar efectivo' : 'Retirar efectivo',
    question: isDeposito ? '¿Cuánto agregas?' : '¿Cuánto retiras?',
    btn: isDeposito ? 'Agregar' : 'Retirar',
  };
}

export function CajaMovimientoSheet(props: CajaMovimientoSheetProps): ReactElement {
  const input = useNumpadInput();
  const [motivo, setMotivo] = useState('');
  const isDeposito = props.tipo === 'deposito';
  const labels = movLabels(isDeposito);
  const canSubmit = input.centavos > ZERO && motivo.trim().length > 0;

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={labels.title}
      testID={props.testID ?? `caja-movimiento-sheet-${props.tipo}`}
    >
      <MovimientoSheetBody
        input={input}
        motivo={motivo}
        setMotivo={setMotivo}
        isDeposito={isDeposito}
        labels={labels}
        canSubmit={canSubmit}
        submitting={props.submitting === true}
        onSubmit={props.onSubmit}
      />
    </Modal>
  );
}

function MovimientoSheetBody(props: {
  input: ReturnType<typeof useNumpadInput>;
  motivo: string;
  setMotivo: (v: string) => void;
  isDeposito: boolean;
  labels: { question: string; btn: string };
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: (montoCentavos: Money, motivo: string) => void;
}): ReactElement {
  return (
    <ScrollView style={{ maxHeight: 560 }}>
      <View gap={16} paddingHorizontal={4}>
        <MovimientoQuestion label={props.labels.question} />
        <NumpadDisplay value={props.input.display} />
        <Numpad onPress={props.input.onKey} />
        <Input
          label="Motivo"
          value={props.motivo}
          onChange={props.setMotivo}
          placeholder={props.isDeposito ? 'Cambio en monedas' : 'Retiro para banco'}
          testID="caja-movimiento-motivo"
        />
        <MovimientoSubmitBtn
          isDeposito={props.isDeposito}
          label={props.labels.btn}
          canSubmit={props.canSubmit}
          submitting={props.submitting}
          onPress={() => {
            props.onSubmit(props.input.centavos, props.motivo.trim());
            props.input.reset();
            props.setMotivo('');
          }}
        />
      </View>
    </ScrollView>
  );
}

function MovimientoQuestion(props: { label: string }): ReactElement {
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.semibold.toString()}
      fontSize={fontSizes.lg}
      color={colors.gray600}
      textAlign="center"
    >
      {props.label}
    </Text>
  );
}

function MovimientoSubmitBtn(props: {
  isDeposito: boolean;
  label: string;
  canSubmit: boolean;
  submitting: boolean;
  onPress: () => void;
}): ReactElement {
  return (
    <Btn
      variant={props.isDeposito ? 'green' : 'danger'}
      fullWidth
      size="lg"
      icon={<Icon name="check" size={18} color={colors.white} />}
      onPress={props.onPress}
      disabled={!props.canSubmit}
      loading={props.submitting}
      testID="caja-movimiento-submit"
    >
      {props.label}
    </Btn>
  );
}
