import { colors } from '@xangarro/tokens';

import type { Categoria } from './types';

/** Each category's tint: the catalogue tiles and the ticket's quantity boxes (Detalle de venta). */
export const TINT: Record<Categoria, string> = {
  Tacos: colors.redSoft,
  Guisados: colors.peachSoft,
  Bebidas: colors.blueSoft,
  Extras: colors.greenSoft,
};
