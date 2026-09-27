import { colors } from '@xangarro/tokens';

import type { CategoriaGasto } from './types';

/** Each category's tint, chip colours and Lucide glyph, from OpGastos. */
export const CAT_TINT: Record<CategoriaGasto, string> = {
  Insumos: colors.peachSoft,
  Servicios: colors.blueSoft,
  Transporte: colors.purpleSoft,
  Mantenimiento: colors.gray100,
  Otros: colors.white,
};

/** The chip's text and edge colour on its tint. */
export const CAT_TINTA: Record<CategoriaGasto, string> = {
  Insumos: colors.black,
  Servicios: colors.blueText,
  Transporte: colors.purple,
  Mantenimiento: colors.ink,
  Otros: colors.gray600,
};

export const CAT_ICON: Record<CategoriaGasto, string> = {
  Insumos:
    'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73zM12 22V12M3.29 7 12 12l8.71-5',
  Servicios:
    'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z',
  Transporte:
    'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0M9 17h6M15 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
  Mantenimiento:
    'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  Otros: 'M4 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1-2-1-2 1zM8 9h8M8 13h6',
};
