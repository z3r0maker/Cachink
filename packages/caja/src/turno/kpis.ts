import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { enPalabras } from '../inicio/copy';
import { hintCanceladas } from '../comun/frases';
import type { StatItem } from '../comun/stat';
import type { TurnoData } from './types';

/** «Salieron de la caja · 4 comprobantes»: the Gastos tile's hint. */
export function hintSalieron(n: number): string {
  const piezas = n === 1 ? 'comprobante' : 'comprobantes';
  return `Salieron de la caja · ${n} ${piezas}`;
}

/** Mi turno's four figures (`OpTurno.dc.html`), the web's `kpis` shared. */
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
    {
      label: 'Fiado',
      value: formatMoney(d.fiado),
      color: colors.warningText,
      hint: `${enPalabras(d.clientesFiados)} clientes`,
    },
    {
      label: 'Gastos',
      value: formatMoney(d.gastos),
      color: colors.redText,
      hint: hintSalieron(d.comprobantes),
    },
  ];
}
