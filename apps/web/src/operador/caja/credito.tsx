'use client';

import { useState } from 'react';
import { formatMoney } from '@xangarro/domain';

import * as m from '../ui/mostrador.css';
import * as c from './cobro.css';
import * as k from './credito.css';
import { ClienteRadio, ClienteNuevo, filtrar } from './credito-partes';
import type { ClienteFiado } from './types';
import type { Caja } from './use-caja';

export interface CreditoProps {
  readonly caja: Caja;
  readonly clientes: readonly ClienteFiado[];
  /** False on a linked register: fiado needs an existing client (O-33). */
  readonly permitirNuevo?: boolean;
}

/** Anótalo a su cuenta: no client, no sale (rule 5). A new client travels by
 *  name in the note until the client form lands (C-18); Pedro reviews it. */
export function Credito({ caja, clientes, permitirNuevo = true }: CreditoProps) {
  const x = useCredito(caja);
  const lista = filtrar(clientes, x.q);
  return (
    <div className={k.wrap}>
      <label className={m.campo}>
        <input
          type="search"
          className={m.campoInput}
          aria-label="Busca al cliente"
          placeholder="Busca al cliente"
          value={x.q}
          onChange={(ev) => x.setQ(ev.target.value)}
        />
      </label>
      <div className={k.lista} role="radiogroup" aria-label="A quién se lo anotas">
        {lista.map((c) => (
          <ClienteRadio
            key={c.id}
            k={c}
            total={caja.total}
            on={x.nuevo === null && x.elegido?.id === c.id}
            onPick={() => x.elegir(c)}
          />
        ))}
        {lista.length === 0 ? (
          <span className={k.vacio}>No hay nadie con ese nombre. Agrégalo como cliente nuevo.</span>
        ) : null}
      </div>
      {permitirNuevo ? <ClienteNuevo nombre={x.nuevo} onNombre={x.setNuevo} /> : null}
      <Anotar caja={caja} quien={x.quien} nuevo={x.nuevo !== null} onAnotar={x.registrar} />
    </div>
  );
}

function useCredito(caja: Caja) {
  const [q, setQ] = useState('');
  const [elegido, setElegido] = useState<ClienteFiado | null>(null);
  const [nuevo, setNuevo] = useState<string | null>(null);
  const quien = nuevo === null ? (elegido?.nombre ?? null) : nuevo.trim() || null;
  const registrar = () => {
    if (quien === null) return;
    caja.vender({
      metodo: 'Fiado',
      cambio: null,
      nota:
        nuevo === null
          ? `Se sumó al saldo de ${quien}.`
          : `Se anotó a ${quien}, cliente nuevo por revisar.`,
      ...(nuevo === null && elegido ? { clienteId: elegido.id } : {}),
    });
  };
  const elegir = (c: ClienteFiado) => {
    setElegido(c);
    setNuevo(null);
  };
  return { q, setQ, elegido, nuevo, setNuevo, quien, registrar, elegir };
}

function Anotar(p: {
  readonly caja: Caja;
  readonly quien: string | null;
  readonly nuevo: boolean;
  readonly onAnotar: () => void;
}) {
  const label =
    p.quien === null
      ? p.nuevo
        ? 'Escribe su nombre'
        : 'Elige a quién se lo anotas'
      : `Anotar ${formatMoney(p.caja.total)} a ${p.quien}`;
  return (
    <>
      <button type="button" className={c.confirm} disabled={p.quien === null} onClick={p.onAnotar}>
        {label}
      </button>
      <button type="button" className={k.cambiar} onClick={() => p.caja.setPaso('catalogo')}>
        Cambiar la forma de pago
      </button>
    </>
  );
}
