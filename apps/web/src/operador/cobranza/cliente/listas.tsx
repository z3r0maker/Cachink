import Link from 'next/link';
import { formatMoney, type EstadoCuenta } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../../shell/icon';
import { OPERADOR_BASE } from '../../shell/nav';
import * as l from '../../turno/lists.css';
import * as f from '../../ui/filters.css';
import * as u from '../../ui/ui.css';
import * as v from '../../ventas/ventas.css';
import * as c from '../cobranza.css';
import * as s from './cliente.css';
import { abiertas, historial, type Abierta } from './derive';
import type { CuentaCliente } from './types';

const CHEVRON = 'M9 6l6 6-6 6';
const CHECK = 'M20 6 9 17l-5-5';
const ARRIBA = 'M12 19V5M5 12l7-7 7 7';
const ABAJO = 'M12 5v14M5 12l7 7 7-7';

/** «Ventas abiertas», oldest first, with «Ya abonó» on the partly paid one. */
export function Abiertas({
  cuenta,
  e,
}: {
  readonly cuenta: CuentaCliente;
  readonly e: EstadoCuenta;
}) {
  const lista = abiertas(cuenta, e);
  return (
    <div className={u.listCard}>
      <div className={c.abonosHead} style={{ flexWrap: 'wrap' }}>
        <span className={u.eyebrow}>Ventas abiertas</span>
        <span className={u.countPill}>{lista.length}</span>
        <span className={u.headNote}>Lo que abone se aplica a la más antigua primero.</span>
      </div>
      {lista.map((x) => (
        <FilaAbierta key={x.venta.folio} x={x} />
      ))}
      {lista.length === 0 ? <NoDebe /> : null}
    </div>
  );
}

function FilaAbierta({ x }: { readonly x: Abierta }) {
  return (
    <div className={s.fila} data-hover="">
      <span className={v.folio}>{x.venta.folio}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={l.name}>{x.venta.concepto}</div>
        <div className={l.detail}>{`${x.venta.dia} · ${x.orden}`}</div>
      </div>
      {x.pagado > 0n ? (
        <span
          className={s.chip}
          data-parcial=""
          style={{ background: colors.blueSoft, color: colors.blueText }}
        >
          {`Ya abonó ${formatMoney(x.pagado)}`}
        </span>
      ) : null}
      <span className={s.cifra} data-grande="">
        {formatMoney(x.pendiente)}
      </span>
      <Link
        href={`${OPERADOR_BASE}/ventas/${x.venta.folio}`}
        className={v.square}
        title="Ver el ticket"
      >
        <Icon path={CHEVRON} size={16} strokeWidth={2.5} />
      </Link>
    </div>
  );
}

function NoDebe() {
  return (
    <div className={s.nada}>
      <div className={s.nadaTile}>
        <Icon path={CHECK} size={26} strokeWidth={2.7} />
      </div>
      <div className={f.noneTitle}>No debe nada</div>
      <div className={f.noneBody}>Todas sus ventas fiadas están liquidadas.</div>
    </div>
  );
}

/** «Movimientos»: tickets (+) and abonos (−), newest first. */
export function Movimientos({
  cuenta,
  e,
}: {
  readonly cuenta: CuentaCliente;
  readonly e: EstadoCuenta;
}) {
  return (
    <div className={u.listCard}>
      <div className={c.abonosHead}>
        <span className={u.eyebrow}>Movimientos</span>
      </div>
      {historial(cuenta, e).map((m) => {
        const abono = m.tipo === 'abono';
        return (
          <div key={`${m.tipo}${m.fecha}`} className={s.fila} data-mov="">
            <span
              className={s.movTile}
              style={{ background: abono ? colors.greenSoft : colors.warningSoft }}
            >
              <Icon path={abono ? ARRIBA : ABAJO} size={18} strokeWidth={2.4} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={s.movTitulo}>{m.titulo}</div>
              <div className={l.detail}>{m.detalle}</div>
            </div>
            <span className={s.cifra} style={{ color: abono ? colors.greenText : colors.black }}>
              {`${abono ? '−' : '+'}${formatMoney(m.monto)}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
