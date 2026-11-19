import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { hintCanceladas } from '../comun/frases';
import type { StatItem } from '../comun/stat';
import type { TurnoData } from './types';

/**
 * Mi turno's two figures (MvTurno: Ventas and Cobrado). Fiado and Gastos
 * left the tiles for «Lo de tu turno»'s rows (`filas.ts`).
 */
export function kpisMiTurno(d: TurnoData): readonly StatItem[] {
  return [
    {
      label: 'Ventas',
      value: String(d.ventas),
      color: colors.black,
      hint: hintCanceladas(d.canceladas, d.ultimaCancelada),
    },
    {
      label: 'Cobrado',
      value: formatMoney(d.cobrado),
      color: colors.greenText,
      hint: 'Todos los métodos',
    },
  ];
}
