'use client';

import { useState } from 'react';
import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as l from '../turno/lists.css';
import { Note } from '../ui/note';
import * as c from './cobro.css';
import * as e from './efectivo.css';
import type { ClienteFiado } from './types';
import type { Caja } from './use-caja';

const PLUS = 'M12 5v14M5 12h14';
/** The design picks a placeholder; the client form (name + phone) lands with C-18. */
const NUEVO: ClienteFiado = {
  id: 'nuevo',
  nombre: 'Cliente nuevo (por revisar)',
  telefono: '',
  saldo: 0n,
};

/** Venta fiada: no client, no sale (rule 5). On a linked register the client
 *  must exist in the database — the sale travels with its id (O-33). */
export function Credito({
  caja,
  clientes,
  permitirNuevo = true,
}: {
  readonly caja: Caja;
  readonly clientes: readonly ClienteFiado[];
  readonly permitirNuevo?: boolean;
}) {
  const [cliente, setCliente] = useState<ClienteFiado | null>(null);
  const registrar = () =>
    cliente !== null &&
    caja.vender({
      metodo: 'Fiado',
      cambio: null,
      nota: `Se sumó al saldo de ${cliente.nombre}.`,
      ...(cliente.id === 'nuevo' ? {} : { clienteId: cliente.id }),
    });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Note bg={colors.warningSoft} weight="bold">
        Una venta fiada necesita cliente. Sin nombre no se puede cobrar después.
      </Note>
      <div className={e.clientes}>
        {clientes.map((k) => (
          <Cliente key={k.id} k={k} picked={cliente?.id === k.id} onPick={() => setCliente(k)} />
        ))}
      </div>
      {permitirNuevo ? (
        <button type="button" className={e.nuevoCliente} onClick={() => setCliente(NUEVO)}>
          <Icon path={PLUS} size={17} strokeWidth={2.4} />
          Cliente nuevo
        </button>
      ) : null}
      <button type="button" className={c.confirm} disabled={!cliente} onClick={registrar}>
        {cliente ? 'Registrar fiado' : 'Elige un cliente'}
      </button>
    </div>
  );
}

function Cliente(p: {
  readonly k: ClienteFiado;
  readonly picked: boolean;
  readonly onPick: () => void;
}) {
  const debe = p.k.saldo > 0n;
  return (
    <button type="button" className={e.cliente} aria-pressed={p.picked} onClick={p.onPick}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className={l.name}
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {p.k.nombre}
        </div>
        <div className={l.detail}>{p.k.telefono}</div>
      </div>
      <span className={l.saldo} style={{ color: debe ? colors.warningText : colors.gray600 }}>
        {debe ? `Debe ${formatMoney(p.k.saldo)}` : 'Sin saldo'}
      </span>
    </button>
  );
}
