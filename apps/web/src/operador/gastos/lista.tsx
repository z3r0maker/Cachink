import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as l from '../turno/lists.css';
import { SinResultados } from '../ui/filters';
import * as u from '../ui/ui.css';
import * as v from '../ventas/ventas.css';
import * as g from './gastos.css';
import { CAT_ICON, CAT_TINT } from './icons';
import type { GastoTurno } from './types';

/** The turno's expenses, newest first; the amount in red because it left the drawer. */
export function ListaGastos({ gastos }: { readonly gastos: readonly GastoTurno[] }) {
  return (
    <div className={u.listCard}>
      {gastos.map((x) => (
        <Fila key={x.id} x={x} />
      ))}
      {gastos.length === 0 ? (
        <SinResultados body="Ningún gasto de tu turno coincide con lo que buscas." />
      ) : null}
    </div>
  );
}

function Fila({ x }: { readonly x: GastoTurno }) {
  const tint = CAT_TINT[x.categoria];
  return (
    <div className={`${v.row} ${u.rowWrap}`}>
      <div className={u.rowMain} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className={g.tile} style={{ background: tint }}>
          <Icon path={CAT_ICON[x.categoria]} size={20} strokeWidth={2.3} />
        </span>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <div className={l.name}>{x.concepto}</div>
          <div className={l.detail}>{x.detalle}</div>
        </div>
      </div>
      <span className={v.method} style={{ background: tint }}>
        {x.categoria}
      </span>
      <span className={g.proof} data-sin={x.comprobante ? undefined : ''}>
        {x.comprobante ? 'Con comprobante' : 'Sin comprobante'}
      </span>
      <span className={v.time} style={{ minWidth: 56 }}>
        {x.hora}
      </span>
      <span className={v.amount} style={{ color: colors.redText, marginLeft: 'auto' }}>
        {`−${formatMoney(x.monto)}`}
      </span>
    </div>
  );
}
