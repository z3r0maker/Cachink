/**
 * A move's kind said on its tint (M-09): the label the turno's movements
 * wear. A move starts on its product's row (RvInventario), not here.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { TipoMovimiento } from '@xangarro/caja/inventario';
import { MText } from '../../components/Mostrador/index';
import { borderWidths, colors, shapeRadii } from '../../theme';
import { tinteDeTipo } from './mover-glifos';

export type TipoMover = TipoMovimiento;

/** The kind's pill on a movement row: «Entrada» green, «Merma» red. */
export function EtiquetaTipo(p: { readonly tipo: TipoMover }): ReactElement {
  return (
    <View
      paddingHorizontal={11}
      paddingVertical={3}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={tinteDeTipo(p.tipo)}
    >
      <MText size="tag" weight="extraBold">
        {p.tipo}
      </MText>
    </View>
  );
}
