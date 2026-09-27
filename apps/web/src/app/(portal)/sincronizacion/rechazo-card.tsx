'use client';

import { useState, useTransition } from 'react';

import { motivoDeRechazo } from '@/lib/sync-motivos';

import { fechaHoraLarga } from '../suscripcion/fecha';
import { IconoAlerta, IconoCheck } from '../suscripcion/iconos';
import { btn } from '../suscripcion/suscripcion.css';
import { IconoCaja, IconoInventario, IconoTicket } from './iconos';
import * as c from './rechazo.css';
import { fade, panel } from './sincronizacion.css';
import { cajaDe, claseDe, consejo, queEs, tituloDe, type Rechazo } from './rechazo-texto';

/**
 * A refused record as a card: what it was, from which caja, why it did not
 * enter (a sentence, never a code) and what to do. «Ver detalle» opens the
 * facts; «Ya lo resolví» is for the owner and admins only.
 */
const ICONO = { inventario: IconoInventario, venta: IconoTicket, otro: IconoCaja } as const;

function Datos({ r }: { readonly r: Rechazo }) {
  const datos: readonly (readonly [string, string])[] = [
    ['Qué', queEs(r).replace(/^(Un|Una) (.)/, (_m, _a, l: string) => l.toUpperCase())],
    ['Caja', cajaDe(r)],
    ['Llegó', fechaHoraLarga(String(r.receivedAt))],
  ];
  return (
    <div className={`${c.datos} ${fade}`}>
      {datos.map(([k, v]) => (
        <span key={k} className={c.dato}>
          <span className={c.datoK}>{k}</span>
          <span className={c.datoV}>{v}</span>
        </span>
      ))}
    </div>
  );
}

function Resolver(props: { readonly onResolver: () => Promise<string | null> }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const click = () =>
    startTransition(async () => {
      setError(await props.onResolver());
    });
  return (
    <>
      <button type="button" className={btn.secundario} disabled={pending} onClick={click}>
        <IconoCheck grosor={2.6} />
        {pending ? 'Guardando…' : 'Ya lo resolví'}
      </button>
      {error === null ? null : (
        <span role="alert" className={c.error}>
          {error}
        </span>
      )}
    </>
  );
}

function Encabezado({ r }: { readonly r: Rechazo }) {
  const clase = claseDe(r);
  const Icono = ICONO[clase];
  return (
    <div className={c.top}>
      <span className={c.tileTono[clase]}>
        <Icono />
      </span>
      <span className={c.cuerpo}>
        <h3 className={c.titulo}>{tituloDe(r)}</h3>
        <span className={c.motivo}>
          <span className={c.motivoIcono}>
            <IconoAlerta />
          </span>
          <span>
            {motivoDeRechazo(r.code)} <span className={c.tip}>{consejo(r)}</span>
          </span>
        </span>
      </span>
    </div>
  );
}

export function RechazoCard(props: {
  readonly r: Rechazo;
  readonly abierto: boolean;
  readonly mayWrite: boolean;
  readonly onResolver: () => Promise<string | null>;
}) {
  const { r } = props;
  const [abierto, setAbierto] = useState(props.abierto);
  return (
    <article className={panel} aria-label={tituloDe(r)}>
      <Encabezado r={r} />
      {abierto ? <Datos r={r} /> : null}
      <div className={c.pie}>
        <span className={c.cuando}>
          {cajaDe(r)} · {fechaHoraLarga(String(r.receivedAt))}
        </span>
        <button
          type="button"
          className={btn.quieto}
          aria-expanded={abierto}
          onClick={() => setAbierto(!abierto)}
        >
          {abierto ? 'Ocultar detalle' : 'Ver detalle'}
        </button>
        {props.mayWrite ? <Resolver onResolver={props.onResolver} /> : null}
      </div>
    </article>
  );
}
