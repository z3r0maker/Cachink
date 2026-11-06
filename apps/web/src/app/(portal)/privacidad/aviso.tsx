'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type ReactNode } from 'react';

import { Banner, Button, Drawer } from '@/components';
import { AVISO_INTEGRAL_URL } from '@/legal/aviso-simplificado';
import { aceptarAvisoNuevo } from '@/server/actions/privacidad';

import { fechaHoraLarga, fechaLarga } from '../suscripcion/fecha';
import { btn } from '../suscripcion/suscripcion.css';
import type { PrivacidadData, TextoDeAviso } from './datos';
import * as s from './privacidad.css';

/** `0.2-borrador` → «0.2»: what a person reads as the version. */
const etiqueta = (version: string) => version.replace(/-borrador$/, '');

type Abrir = (texto: TextoDeAviso, subtitulo: string) => void;

/** The side panel with an aviso's exact text, its version and its fingerprint. */
export function useTexto(): { readonly abrir: Abrir; readonly drawer: ReactNode } {
  const [abierto, setAbierto] = useState<{ texto: TextoDeAviso; subtitulo: string } | null>(null);
  const drawer = (
    <Drawer
      open={abierto !== null}
      onOpenChange={(o) => (o ? null : setAbierto(null))}
      heading="El aviso de privacidad"
      subtitle={abierto?.subtitulo}
      width={560}
    >
      {abierto === null ? null : (
        <div className={s.pila} data-testid="aviso-texto">
          {abierto.texto.parrafos.map((p) => (
            <p key={p} className={s.parrafo}>
              {p}
            </p>
          ))}
          <p className={s.huella}>
            Huella del texto: {abierto.texto.huella}. Es la misma que guardamos cuando lo aceptaste:
            prueba que este es el texto que viste.
          </p>
        </div>
      )}
    </Drawer>
  );
  return { abrir: (texto, subtitulo) => setAbierto({ texto, subtitulo }), drawer };
}

export function TuAviso(props: {
  readonly aceptado: PrivacidadData['aceptado'];
  readonly ver: Abrir;
}) {
  const a = props.aceptado;
  const t = a?.texto ?? null;
  return (
    <section className={s.tarjeta} aria-labelledby="pv-aviso">
      <span className={s.ceja}>Tu aviso de privacidad</span>
      <h2 id="pv-aviso" className={s.h2} data-testid="pv-aceptado">
        {a === null || t === null
          ? 'Todavía no tenemos registrado que aceptaste el aviso.'
          : `Aceptaste la versión ${etiqueta(t.version)} el ${fechaLarga(a.at)}.`}
      </h2>
      <p className={s.sub}>
        Guardamos el texto exacto que viste, para que siempre puedas consultarlo.
      </p>
      <div className={s.acciones}>
        {a === null || t === null ? null : (
          <Button
            variant="secondary"
            onClick={() =>
              props.ver(t, `Versión ${etiqueta(t.version)} · aceptado el ${fechaHoraLarga(a.at)}`)
            }
          >
            Ver el texto que aceptaste
          </Button>
        )}
        <a className={s.enlace} href={AVISO_INTEGRAL_URL}>
          Aviso completo
        </a>
      </div>
    </section>
  );
}

/** «Actualizamos el aviso»: what changed, read it, accept it (express, ADR-137). */
export function AvisoNuevo(props: { readonly nuevo: TextoDeAviso; readonly leer: Abrir }) {
  const n = props.nuevo;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const aceptar = () =>
    startTransition(async () => {
      const r = await aceptarAvisoNuevo();
      if (!r.ok) return setError(r.message);
      setError(null);
      router.refresh();
    });
  return (
    <section className={s.nuevo} aria-labelledby="pv-nuevo" data-testid="pv-aviso-nuevo">
      <h2 id="pv-nuevo" className={s.h2}>
        Actualizamos el aviso de privacidad
      </h2>
      <p className={s.texto}>
        Versión {etiqueta(n.version)} del {fechaLarga(`${n.publicado}T12:00:00Z`)}.
        {n.cambios === null ? '' : ` Qué cambió: ${n.cambios}`}
      </p>
      {error === null ? null : <Banner tone="critical" title={error} />}
      <div className={s.acciones}>
        <Button variant="secondary" onClick={() => props.leer(n, `Versión ${etiqueta(n.version)}`)}>
          Leer el aviso nuevo
        </Button>
        <button
          type="button"
          className={btn.oscuro}
          onClick={aceptar}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? 'Guardando…' : error === null ? 'Acepto el aviso nuevo' : 'Intentar otra vez'}
        </button>
      </div>
    </section>
  );
}
