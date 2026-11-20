/**
 * One client's compact row on Fiado y abonos (board RvFiado): a line under
 * the name and a mark under the amount. «2 ventas abiertas» with «Abonó
 * hoy»; «Sin abonar hace 16 días» with «Atrasado»; «No debe nada · último
 * abono hoy» with no mark. Over the same derivations as `lineaCuenta`. Pure.
 */

import { antiguedad, haceDiasTexto, lineaCuenta } from './antiguedad';
import { abiertas, estadoCuenta } from './cliente/derive';
import type { CuentaCliente } from './cliente/types';

export interface RenglonCuenta {
  /** Under the name. */
  readonly linea: string;
  /** Under the amount: «Atrasado», «Abonó hoy», or nothing. */
  readonly marca: 'Atrasado' | 'Abonó hoy' | null;
}

/** «Abonó hoy», «Sin abonar hace 16 días», «Sin abonos». */
function abonoTexto(diasAbono: number | null): string {
  if (diasAbono === null) return 'Sin abonos';
  return diasAbono === 0 ? 'Abonó hoy' : `Sin abonar hace ${haceDiasTexto(diasAbono)}`;
}

export function renglonCuenta(c: CuentaCliente, hoy: string): RenglonCuenta {
  const a = antiguedad(c, hoy);
  if (a.diasDeuda === null) return { linea: lineaCuenta(c, hoy), marca: null };
  if (c.atrasado) return { linea: abonoTexto(a.diasAbono), marca: 'Atrasado' };
  const n = abiertas(c, estadoCuenta(c)).length;
  return {
    linea: n === 1 ? '1 venta abierta' : `${n} ventas abiertas`,
    marca: a.diasAbono === 0 ? 'Abonó hoy' : null,
  };
}
