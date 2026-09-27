import { formatMoney } from '@xangarro/domain';

import * as r from '../ui/resumen.css';
import * as c from './cobranza.css';
import * as k from './cuenta.css';
import type { AbonoDelDia } from './derive';

/** «Abonos que recibiste hoy», newest first. */
export function AbonosHoy(p: { readonly abonos: readonly AbonoDelDia[] }) {
  if (p.abonos.length === 0) return null;
  return (
    <section aria-labelledby="abonos-hoy" className={c.hoy}>
      <div className={c.hoyHead}>
        <h2 id="abonos-hoy" className={r.eyebrow} style={{ margin: 0 }}>
          Abonos que recibiste hoy
        </h2>
      </div>
      {p.abonos.map((a) => (
        <div key={a.id} className={c.abonoRow}>
          <span className={c.abonoHora}>{a.hora}</span>
          <span className={k.col}>
            <span className={k.fuerte}>{a.cliente}</span>
            <span className={k.tenue}>{a.detalle}</span>
          </span>
          <span className={r.chip.gray}>{a.metodo}</span>
          <span className={c.abonoMonto}>{formatMoney(a.monto)}</span>
        </div>
      ))}
    </section>
  );
}
