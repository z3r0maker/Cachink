/**
 * Product background color mapping — connects domain `ProductColor`
 * keys to soft hex values from the theme palette.
 *
 * Used by ProductoCard, ProductoListRow, and the ColorSwatchPicker.
 */

import type { ProductColor } from '@cachink/domain';
import { colors } from './theme';

/** Maps domain ProductColor keys to soft hex background values. */
export const PRODUCT_BG_COLORS: Record<ProductColor, string> = {
  white: colors.white,
  yellow: colors.yellowSoft,
  green: colors.greenSoft,
  blue: colors.blueSoft,
  pink: colors.redSoft,
  purple: colors.purpleSoft,
  peach: colors.peachSoft,
  gray: colors.gray100,
} as const;

/** Ordered list for the color picker swatch row. */
export const PRODUCT_COLOR_OPTIONS: readonly {
  key: ProductColor;
  label: string;
  hex: string;
}[] = [
  { key: 'white', label: 'Blanco', hex: PRODUCT_BG_COLORS.white },
  { key: 'yellow', label: 'Amarillo', hex: PRODUCT_BG_COLORS.yellow },
  { key: 'green', label: 'Verde', hex: PRODUCT_BG_COLORS.green },
  { key: 'blue', label: 'Azul', hex: PRODUCT_BG_COLORS.blue },
  { key: 'pink', label: 'Rosa', hex: PRODUCT_BG_COLORS.pink },
  { key: 'purple', label: 'Morado', hex: PRODUCT_BG_COLORS.purple },
  { key: 'peach', label: 'Durazno', hex: PRODUCT_BG_COLORS.peach },
  { key: 'gray', label: 'Gris', hex: PRODUCT_BG_COLORS.gray },
];
