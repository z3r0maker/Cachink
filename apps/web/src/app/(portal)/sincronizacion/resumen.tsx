'use client';

import Link from 'next/link';

import type { SincronizacionData } from '@/server/screens';

import { fechaHoraLarga } from '../suscripcion/fecha';
import * as k from './cajas.css';
import { IconoCaja, IconoWifi } from './iconos';
import type { Rechazo } from './rechazo-texto';
import * as s from './sincronizacion.css';

/**
 * «Tus cajas»: one row per linked device, with when it last sent and whether
 * it has records waiting for review. Times are on the business's clock.
 */
type Dispositivo = SincronizacionData['dispositivos'][number];
type Estado = 'alDia' | 'revisar' | 'fuera';

function estadoDe(d: Dispositivo, pendientes: number): readonly [Estado, string] {
  if (d.revokedAt !== null) return ['fuera', 'Desvinculada'];
  if (pendientes === 0) return ['alDia', 'Al día'];
  const n = pendientes === 1 ? '1 registro' : `${pendientes} registros`;
  return ['revisar', `Con ${n} por revisar`];
}

function Caja({ d, pendientes }: { readonly d: Dispositivo; readonly pendientes: number }) {
  const [tono, label] = estadoDe(d, pendientes);
  return (
    <div className={k.caja}>
      <span className={k.cajaIcono}>
        <IconoCaja />
      </span>
      <span className={k.cajaTexto}>
        <span className={k.cajaNombre}>{d.nombre}</span>
        <span className={k.cajaCuando}>
          {d.lastPushAt === null
            ? 'Todavía no envía nada.'
            : `Envió por última vez el ${fechaHoraLarga(d.lastPushAt)}`}
        </span>
      </span>
      <span className={k.pillTono[tono]}>
        <span className={k.puntoTono[tono]} aria-hidden="true" />
        {label}
      </span>
    </div>
  );
}

export function Cajas(props: {
  readonly dispositivos: readonly Dispositivo[];
  readonly abiertos: readonly Rechazo[];
}) {
  const por = (id: string) => props.abiertos.filter((r) => r.deviceId === id).length;
  return (
    <>
      <div className={s.colHead}>
        <h2 className={s.eyebrow}>Tus cajas</h2>
        <span className={s.nota}>
          <IconoWifi />
          Las cajas envían solas en cuanto tienen internet.
        </span>
      </div>
      {props.dispositivos.length === 0 ? (
        <p className={s.vacio}>
          <span>
            Todavía no vinculas ninguna caja.{' '}
            <Link href="/equipo" className={k.vincular}>
              Vincular una caja
            </Link>
          </span>
        </p>
      ) : null}
      {props.dispositivos.map((d) => (
        <Caja key={d.id} d={d} pendientes={por(d.id)} />
      ))}
    </>
  );
}
