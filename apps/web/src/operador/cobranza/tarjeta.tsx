import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as r from '../ui/resumen.css';
import * as c from './cobranza.css';
import { estado, resumenCliente, saldo, type EstadoCliente } from './derive';
import type { CuentaCliente } from './cliente/types';

const CHEVRON = 'm9 18 6-6-6-6';

export const TONO: Record<EstadoCliente, r.ChipTone> = {
  'Al día': 'gray',
  Atrasado: 'red',
  'Sin saldo': 'green',
};

/** The client's state chip: «Atrasado» red, «Al día» quiet, «Sin saldo» green. */
export function EstadoChip({ x }: { readonly x: CuentaCliente }) {
  const e = estado(x);
  return <span className={r.chip[TONO[e]]}>{e}</span>;
}

/** A client: avatar, state, balance, the age of the debt, «Recibir abono» and «Ver cuenta». */
export function Tarjeta(p: {
  readonly x: CuentaCliente;
  readonly abierta: boolean;
  readonly onAbonar: () => void;
  readonly onVer: () => void;
}) {
  const debe = saldo(p.x) > 0n;
  return (
    <article className={c.card} data-sel={p.abierta ? '' : undefined}>
      <div className={c.cabeza}>
        <span className={c.avatar} style={{ background: p.x.tint }} aria-hidden="true">
          {p.x.iniciales}
        </span>
        <span className={c.quien}>
          <span className={c.nombre}>{p.x.nombre}</span>
          <span className={c.tel}>{p.x.telefono}</span>
        </span>
        <EstadoChip x={p.x} />
      </div>
      <div className={c.saldoRow}>
        <span className={r.eyebrow}>Saldo</span>
        <span className={c.saldo} style={{ color: debe ? colors.warningText : colors.black }}>
          {formatMoney(saldo(p.x))}
        </span>
      </div>
      <span className={c.linea}>{resumenCliente(p.x)}</span>
      <Botones debe={debe} nombre={p.x.nombre} onAbonar={p.onAbonar} onVer={p.onVer} />
    </article>
  );
}

function Botones(p: {
  readonly debe: boolean;
  readonly nombre: string;
  readonly onAbonar: () => void;
  readonly onVer: () => void;
}) {
  return (
    <div className={c.botones}>
      {p.debe ? (
        <button type="button" className={c.abonar} onClick={p.onAbonar}>
          Recibir abono
        </button>
      ) : null}
      <button
        type="button"
        className={c.ver}
        data-solo={p.debe ? undefined : ''}
        aria-label={`Ver cuenta de ${p.nombre}`}
        onClick={p.onVer}
      >
        Ver cuenta
        <Icon path={CHEVRON} size={16} strokeWidth={2.4} />
      </button>
    </div>
  );
}
