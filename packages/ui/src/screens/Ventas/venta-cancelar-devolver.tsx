/**
 * The cash a cancelled cash sale hands back (RvCancelar «Ahora sí, devuelve»):
 * said only after the NIP and the permission went through, so the operator
 * never hands money back on a cancellation that could still be refused.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { colors } from '../../theme';

export function DevolverStep(p: {
  /** Centavos handed back to the client. */
  readonly monto: bigint;
  readonly enviando: boolean;
  readonly onConfirmar: () => void;
  readonly onVolver: () => void;
}): ReactElement {
  return (
    <View gap={12}>
      <MText size="xl2" weight="extraBold" style={{ fontVariant: ['tabular-nums'] }}>
        {`Devuelve ${formatMoney(p.monto)} al cliente`}
      </MText>
      <MText weight="semibold" color={colors.ink}>
        Tu NIP y tu permiso ya están confirmados. Entrégale el dinero y toca el botón.
      </MText>
      <Btn
        variant="destructiveFilled"
        size="xl"
        sentence
        fullWidth
        loading={p.enviando}
        disabled={p.enviando}
        onPress={p.onConfirmar}
        testID="cancel-cash-confirm"
      >
        Ya lo devolví, cancelar venta
      </Btn>
      <Btn variant="secondary" size="xl" fullWidth onPress={p.onVolver} testID="cancel-cash-volver">
        Volver
      </Btn>
    </View>
  );
}
