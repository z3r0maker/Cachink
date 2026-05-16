/**
 * Product icon defaults — maps inventory categories to sensible default
 * icons when the user hasn't selected one explicitly.
 */

import type { InventoryCategory, ProductIcon } from './product.js';

const CATEGORY_ICON_DEFAULTS: Record<InventoryCategory, ProductIcon> = {
  'Materia Prima': 'box',
  'Producto Terminado': 'package',
  'Empaque': 'archive',
  'Herramienta': 'wrench',
  'Insumo': 'clipboard-list',
  'Otro': 'tag',
};

/**
 * Returns the product's explicit icon, or a sensible default from its
 * category. Never returns null.
 */
export function resolveProductIcon(
  icono: ProductIcon | null,
  categoria: InventoryCategory,
): ProductIcon {
  return icono ?? CATEGORY_ICON_DEFAULTS[categoria];
}
