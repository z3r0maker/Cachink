/**
 * Inventario's title (M-09) and, beside it, «Escanear» (M-20, EcInventario):
 * the escáner one product at a time, which opens that product's movement.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { colors } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';

export function InventarioTitulo(p: { readonly onEscanear?: () => void }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={10}>
      <View flex={1} minWidth={0} gap={2}>
        <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
          Inventario
        </MText>
        <MText size="md" weight="semibold" color={colors.gray600}>
          Lo que hay y lo que se movió en tu turno
        </MText>
      </View>
      {p.onEscanear ? (
        <Btn
          variant="primary"
          size="lg"
          sentence
          icon={<PathIcon d={COBRAR_GLYPHS.escanear} size={20} />}
          onPress={p.onEscanear}
          testID="inventario-escanear"
        >
          Escanear
        </Btn>
      ) : null}
    </View>
  );
}
