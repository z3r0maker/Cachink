'use client';

import type { CancelLinkView } from '@xangarro/application/billing';
import { formatMoney, PROVEEDOR } from '@xangarro/domain';
import { CircleCheck, LinkIcon, OctagonX } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';

import { Banner, Card } from '@/components';
import { button } from '@/components/button.css';
import { confirmarCancelacionPorEnlace } from '@/server/billing/cancel-link-actions';

import { ceja, pila, placaTono } from '../_publico/publico.css';
import { fechaLarga } from '../(portal)/suscripcion/fecha';
import { btn } from '../(portal)/suscripcion/suscripcion.css';
import { tituloAcceso } from '../login/auth-card.css';
import * as s from './cancelar.css';

type Confirmar = Extract<CancelLinkView, { state: 'confirmar' }>;

const NOMBRE = { xangarro: 'Xangarro', xangarrote: 'Xangarrote' } as const;

function Marco(props: { readonly icono: React.ReactNode; readonly children: React.ReactNode }) {
  return (
    <div className={s.marco}>
      <Card emphasis="hero">
        <div className={pila}>
          <span className={placaTono.amarilla} aria-hidden="true">
            {props.icono}
          </span>
          {props.children}
          <p className={s.pie}>
            ¿Dudas? Escríbenos a {PROVEEDOR.correo}. {PROVEEDOR.razonSocial}, {PROVEEDOR.domicilio}.
          </p>
        </div>
      </Card>
    </div>
  );
}

function Ir({ href, label }: { readonly href: string; readonly label: string }) {
  return (
    <Link href={href} className={button({ variant: 'secondary', full: true })}>
      {label}
    </Link>
  );
}

function Datos({ v }: { readonly v: Confirmar }) {
  const filas = [
    ['Tu plan sigue hasta', fechaLarga(v.endsAt)],
    ['Cobro que ya no se hace', `${formatMoney(BigInt(v.totalCentavos))} con IVA`],
    ['Después', 'Xangarrito, gratis'],
  ] as const;
  return (
    <dl className={s.datos} data-testid="cancelar-datos">
      {filas.map(([k, valor]) => (
        <div key={k} className={s.dato}>
          <dt className={s.clave}>{k}</dt>
          <dd className={s.valor}>{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

function ConfirmarCard(props: {
  readonly v: Confirmar;
  readonly pending: boolean;
  readonly error: string | null;
  readonly onConfirm: () => void;
}) {
  const { v } = props;
  return (
    <>
      {v.negocio ? <span className={ceja}>{v.negocio}</span> : null}
      <h1 className={tituloAcceso}>Cancelar tu plan {NOMBRE[v.planId]}</h1>
      <Datos v={v} />
      <p className={s.texto}>
        Tus ventas, gastos y estados financieros se quedan. Puedes volver a un plan de pago cuando
        quieras.
      </p>
      {props.error === null ? null : <Banner tone="critical" title={props.error} />}
      <button
        type="button"
        className={`${btn.peligro} ${s.lleno}`}
        disabled={props.pending}
        aria-busy={props.pending}
        onClick={props.onConfirm}
      >
        {props.pending ? 'Cancelando…' : 'Sí, cancelar mi suscripción'}
      </button>
    </>
  );
}

function Resultado({ v }: { readonly v: Exclude<CancelLinkView, Confirmar> }) {
  if (v.state === 'vencido') {
    return (
      <>
        <h1 className={tituloAcceso}>Este enlace ya no sirve</h1>
        <p className={s.texto}>
          Cada correo trae un enlace que dura hasta el cobro que anuncia. Puedes cancelar igual de
          rápido desde tu cuenta, en Mi negocio › Plan y pagos.
        </p>
        <Ir href="/login" label="Entrar a mi cuenta" />
      </>
    );
  }
  const fin = fechaLarga(v.endsAt);
  return v.state === 'listo' ? (
    <div className={pila} role="status">
      <h1 className={tituloAcceso}>Listo, cancelaste tu suscripción</h1>
      <p className={s.texto}>
        Tu plan sigue hasta el {fin} y no se te cobrará más. Te mandamos la confirmación a tu
        correo.
      </p>
      <p className={s.texto}>
        ¿Cambiaste de idea? Entra a tu cuenta y en Plan y pagos toca «Seguir con mi plan».
      </p>
      <Ir href="/suscripcion" label="Ir a Plan y pagos" />
    </div>
  ) : (
    <>
      <h1 className={tituloAcceso}>Tu suscripción ya estaba cancelada</h1>
      <p className={s.texto}>Tu plan sigue hasta el {fin}. No hay cobros pendientes.</p>
      <Ir href="/suscripcion" label="Ir a Plan y pagos" />
    </>
  );
}

const ICONO = { confirmar: OctagonX, listo: CircleCheck, ya: CircleCheck, vencido: LinkIcon };

/**
 * The card of `/cancelar` (SbCancelarEnlace): confirm, done, already cancelled,
 * link expired. `inicial` is `null` when the link could not be read at all.
 */
export function CancelarEnlace(props: {
  readonly token: string;
  readonly inicial: CancelLinkView | null;
}) {
  const [view, setView] = useState(props.inicial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  if (view === null) {
    return (
      <Marco icono={<LinkIcon size={24} />}>
        <h1 className={tituloAcceso}>No pudimos abrir tu enlace</h1>
        <p className={s.texto}>No se cambió nada. Intenta otra vez en un momento.</p>
        <Ir href={`/cancelar?t=${encodeURIComponent(props.token)}`} label="Intentar otra vez" />
      </Marco>
    );
  }
  const onConfirm = () =>
    startTransition(async () => {
      const r = await confirmarCancelacionPorEnlace(props.token);
      if (!r.ok) return setError(r.message);
      setView(r.view);
    });
  const Icono = ICONO[view.state];
  return (
    <Marco icono={<Icono size={24} />}>
      {view.state === 'confirmar' ? (
        <ConfirmarCard v={view} pending={pending} error={error} onConfirm={onConfirm} />
      ) : (
        <Resultado v={view} />
      )}
    </Marco>
  );
}
