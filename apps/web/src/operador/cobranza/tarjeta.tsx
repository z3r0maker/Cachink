import Link from 'next/link';
import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import { OPERADOR_BASE } from '../shell/nav';
import * as l from '../turno/lists.css';
import * as u from '../ui/ui.css';
import * as c from './cobranza.css';
import { estado, resumenCliente, saldo, type EstadoCliente } from './derive';
import type { CuentaCliente } from './cliente/types';

const CHEVRON = 'M9 6l6 6-6 6';

const ESTADO: Record<EstadoCliente, { bg: string; color: string }> = {
  'Al día': { bg: colors.gray100, color: colors.gray600 },
  Atrasado: { bg: colors.warningSoft, color: colors.warningText },
  'Sin saldo': { bg: colors.greenSoft, color: colors.greenText },
};

/** A client: avatar, state, balance in 30 px, age of the debt, abono and history. */
export function Tarjeta({
  x,
  onAbonar,
}: {
  readonly x: CuentaCliente;
  readonly onAbonar: () => void;
}) {
  const debe = saldo(x) > 0n;
  return (
    <div className={c.card}>
      <Cabeza x={x} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className={u.eyebrow}>Saldo</span>
        <span className={c.saldo}>{formatMoney(saldo(x))}</span>
      </div>
      <div className={c.texto}>{resumenCliente(x)}</div>
      <div style={{ display: 'flex', gap: 9 }}>
        <button
          type="button"
          className={c.cta}
          data-onyellow=""
          aria-disabled={debe ? undefined : true}
          onClick={debe ? onAbonar : undefined}
        >
          {debe ? 'Recibir abono' : 'Sin saldo por cobrar'}
        </button>
        <Link
          href={`${OPERADOR_BASE}/cobranza/${x.id}`}
          className={c.historial}
          title="Ver historial"
        >
          <Icon path={CHEVRON} size={17} strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}

function Cabeza({ x }: { readonly x: CuentaCliente }) {
  const e = estado(x);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span className={c.avatar} style={{ background: x.tint }}>
        {x.iniciales}
      </span>
      <div style={{ minWidth: 0 }}>
        <div className={c.nombre}>{x.nombre}</div>
        <div className={l.detail}>{x.telefono}</div>
      </div>
      <span className={c.estado} style={{ background: ESTADO[e].bg, color: ESTADO[e].color }}>
        {e}
      </span>
    </div>
  );
}
