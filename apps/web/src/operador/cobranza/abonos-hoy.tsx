import { formatMoney } from '@xangarro/domain';

import * as l from '../turno/lists.css';
import * as u from '../ui/ui.css';
import { METODO_BG } from '../ventas/lista';
import * as v from '../ventas/ventas.css';
import * as c from './cobranza.css';
import type { AbonoDelDia } from './derive';

/** «Abonos que recibiste hoy», newest first. */
export function AbonosHoy(p: { readonly abonos: readonly AbonoDelDia[] }) {
  return (
    <div className={u.listCard}>
      <div className={c.abonosHead}>
        <span className={u.eyebrow}>Abonos que recibiste hoy</span>
      </div>
      {p.abonos.map((a) => (
        <div key={a.id} className={c.abonoRow}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={l.name}>{a.cliente}</div>
            <div className={l.detail}>{a.detalle}</div>
          </div>
          <span className={v.method} style={{ background: METODO_BG[a.metodo] }}>
            {a.metodo}
          </span>
          <span className={v.time} style={{ minWidth: 56 }}>
            {a.hora}
          </span>
          <span className={c.abonoMonto}>{formatMoney(a.monto)}</span>
        </div>
      ))}
    </div>
  );
}
