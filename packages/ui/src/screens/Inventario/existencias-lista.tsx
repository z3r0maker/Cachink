/**
 * Existencias (M-09): one quiet panel of rows — the product's glyph on its
 * tint, its name, «Umbral 15 · kg», the state pill («Reponer» red /
 * «Suficiente» green), the count, and the two quick squares that open the
 * sheets with the product picked. The board's no-results answer when the
 * search filters everything out.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { ICONS, mayuscula } from '@xangarro/caja';
import {
  conUnidad,
  porReponer,
  type Existencia,
  type TipoMovimiento,
} from '@xangarro/caja/inventario';
import { MText } from '../../components/Mostrador/index';
import { QuietPanel } from '../../components/Panel/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, radii, shapeRadii } from '../../theme';
import { BotonFila } from './mover-botones';
import { ProductoTile } from './mover-glifos';

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

function Fila(p: {
  readonly it: Existencia;
  readonly onMover: (tipo: TipoMovimiento, id: string) => void;
}): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={14} paddingVertical={12}>
      <ProductoTile icono={p.it.icono} tint={p.it.tint} />
      <View flex={1} gap={2}>
        <MText size="md" weight="extraBold" letterSpacing={-0.2}>
          {p.it.nombre}
        </MText>
        <MText
          size="xs"
          weight="semibold"
          color={colors.gray600}
        >{`Umbral ${p.it.umbral} · ${p.it.unidad}`}</MText>
      </View>
      <EstadoPill it={p.it} />
      <MText
        size="xl2"
        weight="extraBold"
        letterSpacing={-0.4}
        fontVariant={['tabular-nums']}
        testID={`inventario-cantidad-${p.it.id}`}
      >
        {String(p.it.existencias)}
      </MText>
      <View flexDirection="row" gap={8}>
        <BotonFila
          tipo="Entrada"
          nombre={p.it.nombre}
          onPress={() => p.onMover('Entrada', p.it.id)}
        />
        <BotonFila tipo="Merma" nombre={p.it.nombre} onPress={() => p.onMover('Merma', p.it.id)} />
      </View>
    </View>
  );
}

export function ExistenciasLista(p: {
  readonly items: readonly Existencia[];
  readonly query: string;
  readonly onMover: (tipo: TipoMovimiento, id: string) => void;
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
          <Fila it={it} onMover={p.onMover} />
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

/** The board's centered empty answer: a yellow tile, a title, a body. */
export function SinProductos(p: { readonly dueno: string }): ReactElement {
  return (
    <View testID="inventario-sin-productos" padding={32} gap={10} alignItems="center">
      <View
        width={56}
        height={56}
        alignItems="center"
        justifyContent="center"
        borderRadius={radii[4]}
        borderWidth={borderWidths.thick}
        borderColor={colors.black}
        backgroundColor={colors.yellowSoft}
        aria-hidden
      >
        <PathIcon d={ICONS.inventario} size={26} strokeWidth={2.3} />
      </View>
      <MText size="lg" weight="extraBold" letterSpacing={-0.4} textAlign="center">
        Sin productos con existencias
      </MText>
      <MText size="md" weight="semibold" color={colors.gray600} textAlign="center">
        {`Cuando ${mayuscula(p.dueno)} dé de alta el catálogo con sus existencias, aquí podrás registrar entradas y mermas.`}
      </MText>
    </View>
  );
}
