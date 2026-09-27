import { colors } from '@xangarro/tokens';
import { formatMoney } from '@xangarro/domain';

import { enPalabras } from '@xangarro/caja/inicio';
import { hintCanceladas, type StatItem } from '@xangarro/caja';
import type { TurnoData } from '@xangarro/caja/turno';

/** The four turno figures (`OpTurno.dc.html`). */
export function kpis(d: TurnoData): readonly StatItem[] {
  const comprobantes = `Salieron de la caja · ${d.comprobantes} ${d.comprobantes === 1 ? 'comprobante' : 'comprobantes'}`;
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
    { label: 'Gastos', value: formatMoney(d.gastos), color: colors.redText, hint: comprobantes },
  ];
}
