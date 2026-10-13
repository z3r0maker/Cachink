/**
 * Inventario's glyphs (Track M, M-09): the two arrows the boards draw on
 * every entrada (up, green) and merma (down, red), and the product tile —
 * the register's multi-path `PRODUCT_ICONS` strokes on the product's tint.
 * The paths are copied from the board; the check is the frame's own.
 */
import type { ReactElement } from 'react';
import Svg, { Path } from 'react-native-svg';
import { View } from '@tamagui/core';
import { PRODUCT_ICONS, type ProductIcon } from '@xangarro/caja';
import { borderWidths, colors, radii, shapeRadii } from '../../theme';
import { GLYPHS } from '../../components/PathIcon/glyphs';
import { PathIcon } from '../../components/PathIcon/index';

/** The board's `M12 19V5M5 12l7-7 7 7` — what arrived goes up. */
export const FLECHA_ENTRADA = 'M12 19V5M5 12l7-7 7 7';
/** The board's `M12 5v14M5 12l7 7 7-7` — what spoiled goes down. */
export const FLECHA_MERMA = 'M12 5v14M5 12l7 7 7-7';

export const flechaDe = (tipo: 'Entrada' | 'Merma'): string =>
  tipo === 'Entrada' ? FLECHA_ENTRADA : FLECHA_MERMA;

/** The tint an entrada or a merma wears, as the boards colour them. */
export const tinteDeTipo = (tipo: 'Entrada' | 'Merma'): string =>
  tipo === 'Entrada' ? colors.greenSoft : colors.redSoft;

/** One of the register's product glyphs — several are multi-path. */
export function GlifoProducto(p: {
  readonly icono: ProductIcon;
  readonly size?: number;
}): ReactElement {
  const size = p.size ?? 21;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {PRODUCT_ICONS[p.icono].map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={colors.black}
          strokeWidth={2.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}

/** The product's tile: its glyph on its tint, the thin black edge (42 px). */
export function ProductoTile(p: {
  readonly icono: ProductIcon;
  readonly tint: string;
  readonly size?: number;
}): ReactElement {
  const size = p.size ?? 42;
  return (
    <View
      width={size}
      height={size}
      alignItems="center"
      justifyContent="center"
      borderRadius={radii[2]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={p.tint}
      aria-hidden
    >
      <GlifoProducto icono={p.icono} size={Math.round(size * 0.5)} />
    </View>
  );
}

/** The movement's tile: its kind's arrow on the kind's tint. */
export function TipoTile(p: { readonly tipo: 'Entrada' | 'Merma' }): ReactElement {
  return (
    <View
      width={42}
      height={42}
      alignItems="center"
      justifyContent="center"
      borderRadius={radii[2]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={tinteDeTipo(p.tipo)}
      aria-hidden
    >
      <PathIcon d={flechaDe(p.tipo)} size={19} strokeWidth={2.5} />
    </View>
  );
}

/** The toast's check in its white square, as the board draws the head. */
export function CheckCuadro(): ReactElement {
  return (
    <View
      width={28}
      height={28}
      alignItems="center"
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
      aria-hidden
    >
      <PathIcon d={GLYPHS.check} size={16} strokeWidth={2.6} />
    </View>
  );
}
