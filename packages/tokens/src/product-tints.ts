import { colors } from './colors.js';

/**
 * The eight background tints a product tile can wear, in picker order, with
 * the Spanish name the picker shows (P-07). Both clients read this one list.
 *
 * The keys are the domain's `ProductColor` values. This package has no
 * dependencies, so it cannot import that type; each client checks the map
 * with `satisfies Record<ProductColor, …>`, and drift fails to compile there.
 */
export const productTints = {
  white: { hex: colors.white, label: 'Blanco' },
  yellow: { hex: colors.yellowSoft, label: 'Amarillo' },
  green: { hex: colors.greenSoft, label: 'Verde' },
  blue: { hex: colors.blueSoft, label: 'Azul' },
  pink: { hex: colors.redSoft, label: 'Rosa' },
  purple: { hex: colors.purpleSoft, label: 'Morado' },
  peach: { hex: colors.peachSoft, label: 'Durazno' },
  gray: { hex: colors.gray100, label: 'Gris' },
} as const;

export type ProductTintKey = keyof typeof productTints;
