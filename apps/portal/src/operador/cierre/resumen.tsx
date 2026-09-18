import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import * as u from '../ui/ui.css';
import * as s from './cierre.css';
import { cerrarHint } from './copy';
import type { ResumenTurno } from './types';
import type { Cierre } from './use-cierre';

function filas(r: ResumenTurno): readonly (readonly [string, string, string])[] {
  return [
    ['Ventas del turno', String(r.ventas), colors.black],
    ['Cobrado (todos los métodos)', formatMoney(r.cobrado), colors.black],
    ['Ventas canceladas', `${r.canceladas} · ${formatMoney(r.cancelado)}`, colors.redText],
    ['Ventas fiadas', formatMoney(r.fiado), colors.warningText],
    ['Movimientos de inventario', `${r.entradas} entradas · ${r.mermas} mermas`, colors.black],
  ];
}

/** «Resumen del turno» and the one button, blocked while the queue or the note is missing. */
export function Resumen({ x, r }: { readonly x: Cierre; readonly r: ResumenTurno }) {
  return (
    <div className={s.tarjeta}>
      <div className={u.eyebrow}>Resumen del turno</div>
      {filas(r).map(([label, value, color]) => (
        <div key={label} className={s.resumenFila}>
          <span className={s.resumenLabel}>{label}</span>
          <span className={s.resumenValor} style={{ color }}>
            {value}
          </span>
        </div>
      ))}
      <button
        type="button"
        className={s.cerrar}
        data-onyellow=""
        disabled={!x.puede}
        onClick={x.cerrar}
      >
        Cerrar turno
      </button>
      <div className={s.texto} style={{ color: colors.gray600 }}>
        {cerrarHint(x.pendientes, x.faltaNota)}
      </div>
    </div>
  );
}
