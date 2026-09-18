/**
 * Product background color mapping — connects domain `ProductColor`
 * keys to soft hex values from the theme palette.
 *
 * Used by ProductoCard, ProductoListRow, and the ColorSwatchPicker.
 */

import type { ProductColor } from '@xangarro/domain';
import { productTints } from '@xangarro/tokens';

/**
 * Maps domain `ProductColor` keys to their soft background. The values live in
 * `@xangarro/tokens` (`productTints`), shared with the portal (P-07).
 */
export const PRODUCT_BG_COLORS = Object.fromEntries(
  Object.entries(productTints).map(([key, t]) => [key, t.hex]),
) as Record<ProductColor, string>;

/** Ordered list for the color picker swatch row. */
export const PRODUCT_COLOR_OPTIONS: readonly {
  key: ProductColor;
  label: string;
  hex: string;
}[] = (Object.keys(productTints) as ProductColor[]).map((key) => ({
  key,
  label: productTints[key].label,
  hex: productTints[key].hex,
}));

// Compile-time guard: the tokens' keys are exactly the domain's ProductColor.
productTints satisfies Record<ProductColor, { hex: string; label: string }>;
