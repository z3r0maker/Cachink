import { colors } from '@xangarro/tokens';

import type { CategoriaGasto } from './types';

/** Each category's tint and Lucide glyph, from the file. */
export const CAT_TINT: Record<CategoriaGasto, string> = {
  Insumos: colors.greenSoft,
  Servicios: colors.blueSoft,
  Transporte: colors.peachSoft,
  Mantenimiento: colors.purpleSoft,
  Otros: colors.gray100,
};

export const CAT_ICON: Record<CategoriaGasto, string> = {
  Insumos: 'M4 8l8-4 8 4v8l-8 4-8-4V8Zm8-4v20M4 8l8 4 8-4',
  Servicios:
    'M12 3v3m0 12v3M3 12h3m12 0h3M7.5 7.5 5.4 5.4m13.2 13.2-2.1-2.1M16.5 7.5l2.1-2.1M5.4 18.6l2.1-2.1',
  Transporte: 'M5 17h14M6 17V9l2-4h8l2 4v8M8 13h8',
  Mantenimiento: 'M14.7 6.3a4 4 0 1 1-5.4 5.4L4 17v3h3l5.3-5.3',
  Otros: 'M12 3v18M3 12h18',
};
