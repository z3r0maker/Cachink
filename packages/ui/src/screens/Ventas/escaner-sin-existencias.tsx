/**
 * Inventario's escáner on a product Inventario does not list (M-20, decided
 * with the owner 2026-11-19, EcInventario): its stock is not tracked or it is
 * still waiting in Revisión de caja. Nothing is written and no alta is offered,
 * since a second product would repeat the code (ADR-150); the owner decides in
 * the portal whether it keeps stock.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { mayuscula } from '@xangarro/caja';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { borderWidths, colors, radii } from '../../theme';
import type { ProductoCobrar } from './cobrar-catalogo';
import { ProductoIcono } from './cobrar-tile';

export function EscanerSinExistencias(p: {
  readonly producto: ProductoCobrar;
  readonly codigo: string;
  /** «Pedro», or «el dueño». */
  readonly dueno: string;
  readonly onOtro: () => void;
}): ReactElement {
  const { producto } = p;
  return (
    <View
      testID="escaner-sin-existencias"
      padding={12}
      gap={10}
      borderRadius={radii[4]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <View flexDirection="row" alignItems="center" gap={10}>
        <ProductoIcono icono={producto.icono} tint={producto.tint} productoId={producto.id} />
        <View flex={1} minWidth={0}>
          <MText size="md" weight="extraBold">{`${producto.nombre} no lleva existencias`}</MText>
          <MText size="md" weight="bold" color={colors.gray600}>
            {p.codigo}
          </MText>
        </View>
      </View>
      <MText size="md" weight="semibold" color={colors.gray600}>
        {`${mayuscula(p.dueno)} decide en el portal si se le llevan.`}
      </MText>
      <Btn variant="secondary" size="lg" onPress={p.onOtro} testID="escaner-otro">
        Escanear otro
      </Btn>
    </View>
  );
}
