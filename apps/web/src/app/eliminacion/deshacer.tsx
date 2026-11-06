'use client';

import type { CancelarEliminacionView } from '@xangarro/application/cuenta';
import { CircleCheck, LinkIcon, RotateCcw } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Banner } from '@/components';
import { cancelarEliminacion } from '@/server/actions/cancelar-eliminacion';

import { ceja, pila } from '../_publico/publico.css';
import { IrA, TarjetaAviso } from '../_publico/tarjeta-aviso';
import * as s from '../_publico/tarjeta-aviso.css';
import { fechaLarga } from '../(portal)/suscripcion/fecha';
import { btn } from '../(portal)/suscripcion/suscripcion.css';
import { tituloAcceso } from '../login/auth-card.css';

type Pendiente = Extract<CancelarEliminacionView, { state: 'deshacer' }>;

function Datos({ v }: { readonly v: Pendiente }) {
  const filas = [
    ['Se iba a borrar el', fechaLarga(v.eraseAt)],
    ['Negocios', v.negocios.join(', ')],
  ] as const;
  return (
    <dl className={s.datos} data-testid="eliminacion-datos">
      {filas.map(([k, valor]) => (
        <div key={k} className={s.dato}>
          <dt className={s.clave}>{k}</dt>
          <dd className={s.valor}>{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

function Conservar(p: {
  readonly v: Pendiente;
  readonly pending: boolean;
  readonly error: string | null;
  readonly onConfirm: () => void;
}) {
  return (
    <>
      <span className={ceja}>{p.v.email}</span>
      <h1 className={tituloAcceso}>¿Conservar tu cuenta?</h1>
      <Datos v={p.v} />
      <p className={s.texto}>
        Todo vuelve como estaba, también tu plan. Tus cajas se tienen que vincular otra vez desde el
        portal.
      </p>
      {p.error === null ? null : <Banner tone="critical" title={p.error} />}
      <button
        type="button"
        className={`${btn.oscuro} ${s.lleno}`}
        disabled={p.pending}
        aria-busy={p.pending}
        onClick={p.onConfirm}
      >
        {p.pending
          ? 'Un momento…'
          : p.error === null
            ? 'Sí, conservar mi cuenta'
            : 'Intentar otra vez'}
      </button>
    </>
  );
}

function Final({ v }: { readonly v: { readonly state: 'reabierta' | 'vencido' } }) {
  return v.state === 'reabierta' ? (
    <div className={pila} role="status">
      <h1 className={tituloAcceso}>Listo, tu cuenta sigue aquí</h1>
      <p className={s.texto}>
        Cancelamos la eliminación. Tus negocios, tus registros y tu plan siguen igual.
      </p>
      <p className={s.texto}>
        Entra con tu correo y contraseña, y vincula otra vez tus cajas en Mi negocio ›
        Sincronización.
      </p>
      <IrA href="/login" label="Entrar a mi cuenta" />
    </div>
  ) : (
    <>
      <h1 className={tituloAcceso}>Este enlace ya no sirve</h1>
      <p className={s.texto}>
        Ya se usó, o tu cuenta ya se eliminó. Si crees que es un error, escríbenos a
        hola@xangarro.mx con el folio de tu correo.
      </p>
      <IrA href="https://xangarro.mx" label="Ir a xangarro.mx" />
    </>
  );
}

const ICONO = { deshacer: RotateCcw, reabierta: CircleCheck, vencido: LinkIcon };

/** The card of `/eliminacion`. `inicial` is `null` when the link could not be read at all. */
export function Deshacer(props: {
  readonly token: string;
  readonly inicial: CancelarEliminacionView | null;
}) {
  const [view, setView] = useState(props.inicial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  if (view === null) {
    return (
      <TarjetaAviso icono={<LinkIcon size={24} />}>
        <h1 className={tituloAcceso}>No pudimos abrir tu enlace</h1>
        <p className={s.texto}>No se cambió nada. Intenta otra vez en un momento.</p>
        <IrA href={`/eliminacion?t=${encodeURIComponent(props.token)}`} label="Intentar otra vez" />
      </TarjetaAviso>
    );
  }
  const onConfirm = () =>
    startTransition(async () => {
      const r = await cancelarEliminacion(props.token);
      if (!r.ok) return setError(r.message);
      setView(r.view);
    });
  const Icono = ICONO[view.state];
  return (
    <TarjetaAviso icono={<Icono size={24} />}>
      {view.state === 'deshacer' ? (
        <Conservar v={view} pending={pending} error={error} onConfirm={onConfirm} />
      ) : (
        <Final v={view} />
      )}
    </TarjetaAviso>
  );
}
