/**
 * The body of a sale's sheet (MvVentas' open sheet; the web's Detalle de
 * venta): «Lo que llevó» with each product's icon, the four tiles (how it
 * was paid or the change, who and where) and the notes for a cancelled or a
 * fiado sale.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney, type ProductIcon } from '@xangarro/domain';
import type { Ficha, LineaDetalle } from '@xangarro/caja/ventas';
import { Eyebrow } from '../../components/Panel/index';
import { MText } from '../../components/Mostrador/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { ProductoIcono } from '../Ventas/cobrar-tile';

/** A product's glyph and tint, by id; a line whose product is gone gets the box. */
export type IconosProducto = ReadonlyMap<
  string,
  { readonly icono: ProductIcon; readonly tint: string }
>;

const SIN_PRODUCTO = { icono: 'package' as ProductIcon, tint: colors.gray100 };

function Linea(p: { readonly l: LineaDetalle; readonly iconos: IconosProducto }): ReactElement {
  const { l } = p;
  const ic = p.iconos.get(l.productoId) ?? SIN_PRODUCTO;
  const precio = l.precio ?? 0n;
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={12}
      paddingVertical={8}
      paddingHorizontal={12}
      borderRadius={radii[3]}
      backgroundColor={colors.offwhite}
    >
      <ProductoIcono icono={ic.icono} tint={ic.tint} />
      <View flex={1} minWidth={0}>
        <MText size="body" weight="extraBold" numberOfLines={2}>
          {l.nombre}
        </MText>
        <MText size="sm" weight="semibold" color={colors.textMuted} fontVariant={['tabular-nums']}>
          {`${l.cantidad} × ${formatMoney(precio)}`}
        </MText>
      </View>
      <MText size="body" weight="extraBold" fontVariant={['tabular-nums']}>
        {formatMoney(precio * BigInt(l.cantidad))}
      </MText>
    </View>
  );
}

export function LoQueLlevo(p: {
  readonly lineas: readonly LineaDetalle[];
  readonly iconos: IconosProducto;
}): ReactElement {
  return (
    <View gap={8} testID="venta-lineas">
      <Eyebrow>Lo que llevó</Eyebrow>
      {p.lineas.map((l, i) => (
        <Linea key={`${l.productoId}-${i}`} l={l} iconos={p.iconos} />
      ))}
    </View>
  );
}

export function Fichas({ fichas }: { readonly fichas: readonly Ficha[] }): ReactElement {
  return (
    <View flexDirection="row" flexWrap="wrap" gap={8} testID="venta-fichas">
      {fichas.map((f) => (
        <View
          key={f.k}
          flexBasis="47%"
          flexGrow={1}
          minWidth={0}
          paddingVertical={10}
          paddingHorizontal={12}
          gap={2}
          borderRadius={radii[3]}
          borderWidth={borderWidths.quiet}
          borderColor={borderColors.quiet}
          aria-label={`${f.k}: ${f.v}`}
        >
          <MText size="xs" weight="bold" color={colors.textMuted}>
            {f.k}
          </MText>
          <MText
            size="body"
            weight="extraBold"
            color={f.color ?? colors.black}
            numberOfLines={1}
            fontVariant={['tabular-nums']}
          >
            {f.v}
          </MText>
        </View>
      ))}
    </View>
  );
}

/** A tinted note: red for a cancelled sale, amber for fiado, green after cancelling. */
export function Nota(p: {
  readonly texto: string;
  readonly tono: 'rojo' | 'ambar' | 'verde';
  readonly testID?: string;
}): ReactElement {
  const t = {
    rojo: { bg: colors.redSoft, borde: colors.redText },
    ambar: { bg: colors.warningSoft, borde: colors.warningText },
    verde: { bg: colors.greenSoft, borde: colors.greenText },
  }[p.tono];
  return (
    <View
      testID={p.testID}
      role={p.tono === 'verde' ? 'status' : undefined}
      paddingVertical={12}
      paddingHorizontal={14}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={t.borde}
      backgroundColor={t.bg}
    >
      <MText size="md" weight="bold" color={colors.ink}>
        {p.texto}
      </MText>
    </View>
  );
}
