import { colors } from '@xangarro/tokens';

import type { MetodoVenta } from './types';

/** Each method's chip (OpVentas): a soft fill, its text colour and a 2 px edge. */
export const METODO_TONO: Readonly<
  Record<MetodoVenta, { readonly bg: string; readonly fg: string; readonly borde: string }>
> = {
  Efectivo: { bg: colors.greenSoft, fg: colors.greenText, borde: colors.greenText },
  Tarjeta: { bg: colors.purpleSoft, fg: colors.black, borde: colors.purple },
  Transferencia: { bg: colors.blueSoft, fg: colors.blueText, borde: colors.blueText },
  Fiado: { bg: colors.warningSoft, fg: colors.warningText, borde: colors.warningText },
};

/** «Todas» and the four methods, as the filter reads them. */
export const FILTROS: readonly { readonly valor: 'Todos' | MetodoVenta; readonly label: string }[] =
  [
    { valor: 'Todos', label: 'Todas' },
    { valor: 'Efectivo', label: 'Efectivo' },
    { valor: 'Tarjeta', label: 'Tarjeta' },
    { valor: 'Transferencia', label: 'Transferencia' },
    { valor: 'Fiado', label: 'Fiado' },
  ];
