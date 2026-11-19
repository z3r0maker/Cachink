/**
 * Existencias (M-09, RvInventario): one quiet panel of rows — the product's
 * photo square (it takes the photo, M-13) and the rest of the row, one tap
 * that opens the movement sheet (`inventario-filas.tsx`). The no-results
 * answer when the search filters everything out, and Don when there are no
 * products yet.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { conUnidad, porReponer, type Existencia } from '@xangarro/caja/inventario';
import { EstadoVacio } from '../../components/CajaEstado/index';
import { MText } from '../../components/Mostrador/index';
import { QuietPanel } from '../../components/Panel/index';
import { borderWidths, colors, shapeRadii } from '../../theme';
import { FotoTile } from '../../foto-producto/foto-tile';
import { ExistenciaFila } from './inventario-filas';

/** «Reponer» at or under the threshold, «Suficiente» above it. */
export function EstadoPill(p: { readonly it: Existencia }): ReactElement {
  const bajo = porReponer(p.it);
  return (
    <View
      paddingHorizontal={11}
      paddingVertical={3}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={bajo ? colors.redSoft : colors.greenSoft}
    >
      <MText size="tag" weight="extraBold" color={bajo ? colors.redText : colors.greenText}>
        {bajo ? 'Reponer' : 'Suficiente'}
      </MText>
    </View>
  );
}

/** The square's tap (told whether it has a photo) or long press, on a product. */
export type OnFoto = (it: Existencia, gesto: 'tap' | 'tapConFoto' | 'larga') => void;

/** The row's photo square, its gestures said as the screen's. */
function Cuadro(p: { readonly it: Existencia; readonly onFoto: OnFoto }): ReactElement {
  const { it } = p;
  return (
    <FotoTile
      id={it.id}
      nombre={it.nombre}
      icono={it.icono}
      tint={it.tint}
      onPress={(conFoto) => p.onFoto(it, conFoto ? 'tapConFoto' : 'tap')}
      onLongPress={() => p.onFoto(it, 'larga')}
    />
  );
}

function Fila(p: {
  readonly it: Existencia;
  readonly onAbrir: (it: Existencia) => void;
  readonly onFoto: OnFoto;
}): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={12}>
      <Cuadro it={p.it} onFoto={p.onFoto} />
      <ExistenciaFila e={p.it} onPress={() => p.onAbrir(p.it)} />
    </View>
  );
}

export function ExistenciasLista(p: {
  readonly items: readonly Existencia[];
  readonly query: string;
  readonly onAbrir: (it: Existencia) => void;
  readonly onFoto: OnFoto;
}): ReactElement {
  return (
    <QuietPanel label="Existencias" count={p.items.length} testID="inventario-existencias">
      {p.items.map((it, i) => (
        <View
          key={it.id}
          borderTopWidth={i === 0 ? 0 : borderWidths.quiet}
          borderTopColor={colors.gray100}
          paddingHorizontal={14}
        >
          <Fila it={it} onAbrir={p.onAbrir} onFoto={p.onFoto} />
        </View>
      ))}
      {p.items.length === 0 ? (
        <View paddingHorizontal={14} paddingVertical={26} alignItems="center">
          <MText size="md" weight="bold" color={colors.gray600}>
            {`Ningún producto coincide con «${p.query}».`}
          </MText>
        </View>
      ) : null}
    </QuietPanel>
  );
}

/** How much a product has, said with its unit, for the sheet's options. */
export const cantidadConUnidad = (it: Existencia): string => conUnidad(it.existencias, it.unidad);

/** No products yet: Don, one sentence and, where the phone can, «Producto nuevo». */
export function SinProductos(p: { readonly onNuevo?: () => void }): ReactElement {
  return (
    <EstadoVacio
      id="inventario-sin-productos"
      title="Todavía no hay productos"
      body="Da de alta lo que vendes y aquí verás cuánto te queda."
      {...(p.onNuevo ? { cta: { label: 'Producto nuevo', onPress: p.onNuevo } } : {})}
    />
  );
}
