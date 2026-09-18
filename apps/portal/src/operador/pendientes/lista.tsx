import Link from 'next/link';
import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as c from '../cobranza/cobranza.css';
import * as s from './pendientes.css';
import * as inv from '../inventario/inventario.css';
import { ICONS, OPERADOR_BASE } from '../shell/nav';
import * as l from '../turno/lists.css';
import * as f from '../ui/filters.css';
import * as u from '../ui/ui.css';
import * as v from '../ventas/ventas.css';
import { estadoFila, type Fase } from './derive';
import type { RegistroEnCola } from './types';

const CHECK = 'M20 6 9 17l-5-5';

const TIPO = {
  venta: { tint: colors.greenSoft, icon: ICONS.ventas },
  gasto: { tint: colors.redSoft, icon: ICONS.gastos },
} as const;

/** «La cola»: each record with its kind, state, time and amount; or «Nada pendiente». */
export function ListaCola(p: {
  readonly cola: readonly RegistroEnCola[];
  readonly fase: Fase;
  readonly offline: boolean;
}) {
  const estado = estadoFila(p.fase, p.offline);
  return (
    <div className={u.listCard}>
      <div className={c.abonosHead}>
        <span className={u.eyebrow}>La cola</span>
        <span className={u.countPill}>{p.cola.length}</span>
      </div>
      {p.cola.map((r) => (
        <Fila key={r.id} r={r} estado={estado} />
      ))}
      {p.cola.length === 0 ? <NadaPendiente /> : null}
    </div>
  );
}

function Fila({
  r,
  estado,
}: {
  readonly r: RegistroEnCola;
  readonly estado: ReturnType<typeof estadoFila>;
}) {
  const enviando = estado === 'Enviando';
  return (
    <div className={s.fila}>
      <span className={inv.tile} style={{ background: TIPO[r.tipo].tint }}>
        <Icon path={TIPO[r.tipo].icon} size={20} strokeWidth={2.3} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={l.name}>{r.titulo}</div>
        <div className={l.detail}>{r.detalle}</div>
      </div>
      <span
        className={v.method}
        style={{
          background: enviando ? colors.blueSoft : colors.warningSoft,
          color: enviando ? colors.blueText : colors.warningText,
        }}
      >
        {estado}
      </span>
      <span className={v.time} style={{ minWidth: 56 }}>
        {r.hora}
      </span>
      <span className={s.monto}>{`${r.tipo === 'gasto' ? '−' : ''}${formatMoney(r.monto)}`}</span>
    </div>
  );
}

function NadaPendiente() {
  return (
    <div className={s.vacia}>
      <div className={s.vaciaTile}>
        <Icon path={CHECK} size={28} strokeWidth={2.7} />
      </div>
      <div className={s.vaciaTitulo}>Nada pendiente</div>
      <div className={f.noneBody}>
        Todo lo que capturaste ya está en el portal de Pedro. Puedes cerrar el turno cuando quieras.
      </div>
      <Link href={`${OPERADOR_BASE}/cierre`} className={s.alCierre}>
        Ir al cierre de turno
      </Link>
    </div>
  );
}
