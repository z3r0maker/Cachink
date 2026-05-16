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
import {
  Numpad,
  NumpadDisplay,
  useNumpadInput,
} from '../../components/Numpad/index';
import { colors, typography } from '../../theme';

export interface CajaMovimientoSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly tipo: CajaMovimientoTipo;
  readonly onSubmit: (montoCentavos: Money, motivo: string) => void;
  readonly submitting?: boolean;
  readonly testID?: string;
}

export function CajaMovimientoSheet(
  props: CajaMovimientoSheetProps,
): ReactElement {
  const input = useNumpadInput();
  const [motivo, setMotivo] = useState('');
  const isDeposito = props.tipo === 'deposito';
  const title = isDeposito ? 'Agregar efectivo' : 'Retirar efectivo';
  const question = isDeposito ? '¿Cuánto agregas?' : '¿Cuánto retiras?';
  const btnLabel = isDeposito ? 'Agregar' : 'Retirar';
  const canSubmit = input.centavos > ZERO && motivo.trim().length > 0;

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={title}
      testID={props.testID ?? `caja-movimiento-sheet-${props.tipo}`}
    >
      <ScrollView style={{ maxHeight: 560 }}>
        <View gap={16} paddingHorizontal={4}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.semibold.toString()}
            fontSize={16}
            color={colors.gray600}
            textAlign="center"
          >
            {question}
          </Text>

          <NumpadDisplay value={input.display} />
          <Numpad onPress={input.onKey} />

          <Input
            label="Motivo"
            value={motivo}
            onChange={setMotivo}
            placeholder={isDeposito ? 'Cambio en monedas' : 'Retiro para banco'}
            testID="caja-movimiento-motivo"
          />

          <Btn
            variant={isDeposito ? 'green' : 'danger'}
            fullWidth
            size="lg"
            icon={<Icon name="check" size={18} color={colors.white} />}
            onPress={() => {
              props.onSubmit(input.centavos, motivo.trim());
              input.reset();
              setMotivo('');
            }}
            disabled={!canSubmit}
            loading={props.submitting === true}
            testID="caja-movimiento-submit"
          >
            {btnLabel}
          </Btn>
        </View>
      </ScrollView>
    </Modal>
  );
}
