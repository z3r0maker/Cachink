/**
 * A client's state chip on Fiado y abonos (MvCobranza): «Atrasado» on
 * warning, «Al día» quiet, «Sin saldo» green.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { estado, type CuentaCliente, type EstadoCliente } from '@xangarro/caja/cobranza';
import { MText } from '../../components/Mostrador/index';
import { colors, shapeRadii } from '../../theme';

const TONO: Record<EstadoCliente, { bg: string; tinta: string }> = {
  'Al día': { bg: colors.gray100, tinta: colors.gray600 },
  Atrasado: { bg: colors.warningSoft, tinta: colors.warningText },
  'Sin saldo': { bg: colors.greenSoft, tinta: colors.greenText },
};

export function EstadoChip({
  x,
  testID,
}: {
  readonly x: CuentaCliente;
  readonly testID?: string;
}): ReactElement {
  const e = estado(x);
  const tono = TONO[e];
  return (
    <View
      testID={testID}
      backgroundColor={tono.bg}
      borderRadius={shapeRadii.pill}
      paddingHorizontal={10}
      paddingVertical={4}
    >
      <MText size="tag" weight="extraBold" color={tono.tinta}>
        {e}
      </MText>
    </View>
  );
}
