import Link from 'next/link';
import { formatMoney } from '@xangarro/domain';

import { Icon } from '../../shell/icon';
import { OPERADOR_BASE } from '@xangarro/caja';
import { abiertas, estadoCuenta, type CuentaCliente } from '@xangarro/caja/cobranza';
import * as k from './cuenta.css';

const CHECK = 'M20 6 9 17l-5-5';

/** «Ventas abiertas · 2»: oldest first, with what is left on each. */
export function Abiertas({ c }: { readonly c: CuentaCliente }) {
  const vivas = abiertas(c, estadoCuenta(c));
  if (vivas.length === 0) return null;
  return (
    <section aria-labelledby="cta-abiertas" className={k.seccion}>
      <h3 id="cta-abiertas" className={k.h3}>
        Ventas abiertas · {vivas.length}
      </h3>
      {vivas.map((v) => (
        <div key={v.venta.folio} className={k.abierta}>
          <span className={k.folio}>{v.venta.folio}</span>
          <span className={k.col}>
            <span className={k.fuerte}>{v.venta.concepto}</span>
            <span className={k.tenue}>
              {v.venta.dia}
              {v.pagado > 0n
                ? ` · de ${formatMoney(v.venta.monto)}, ya abonó ${formatMoney(v.pagado)}`
                : ''}
            </span>
          </span>
          <span className={k.resta}>{formatMoney(v.pendiente)}</span>
        </div>
      ))}
    </section>
  );
}

/** The two latest abonos, and the way to the whole history. */
export function Abonos({ c }: { readonly c: CuentaCliente }) {
  const ultimos = [...c.abonos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 2);
  return (
    <section aria-labelledby="cta-abonos" className={k.seccion}>
      <div className={k.seccionHead}>
        <h3 id="cta-abonos" className={k.h3}>
          Abonos
        </h3>
        <Link href={`${OPERADOR_BASE}/cobranza/${c.id}`} className={k.historial}>
          Ver historial completo
        </Link>
      </div>
      {ultimos.map((a) => (
        <div key={a.id} className={k.abono}>
          <span className={k.check}>
            <Icon path={CHECK} size={14} strokeWidth={2.6} />
          </span>
          <span className={k.col}>
            <span className={k.fuerte}>
              {a.metodo} · {a.dia}
            </span>
            {a.nota ? <span className={k.tenue}>{a.nota}</span> : null}
          </span>
          <span className={k.abonado}>{formatMoney(a.monto)}</span>
        </div>
      ))}
      {ultimos.length === 0 ? <div className={k.nada}>Todavía no ha abonado.</div> : null}
    </section>
  );
}
