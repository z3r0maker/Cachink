'use client';

import type { SincronizacionData } from '@/server/screens';

import { fechaHoraLarga } from '../suscripcion/fecha';
import * as k from './cajas.css';
import * as s from './sincronizacion.css';

/**
 * «Historial» (P-11): the recent sync activity as sentences (what each caja
 * sent, what did not enter, what the portal changed for the cajas to pull),
 * grouped per minute by the query, newest first. The dot backs the words:
 * black sent, amber refused, blue portal, green resolved here.
 */
type Evento = SincronizacionData['historial'][number];

const registros = (n: number) => `${n} ${n === 1 ? 'registro' : 'registros'}`;

export function describirEvento(e: Evento): string {
  const quien = e.dispositivo ?? 'una caja desvinculada';
  if (e.tipo === 'envio')
    return `${e.dispositivo ?? 'Una caja desvinculada'} envió ${registros(e.registros)}.`;
  if (e.tipo === 'rechazo')
    return `No ${e.registros === 1 ? 'entró' : 'entraron'} ${registros(e.registros)} de ${quien}.`;
  return `Cambios en el portal: ${registros(e.registros)} para las cajas.`;
}

export function HistorialCard(props: {
  readonly eventos: readonly Evento[];
  /** Records resolved on this visit, not in the server's history yet. */
  readonly resueltos: number;
}) {
  const vacio = props.eventos.length === 0 && props.resueltos === 0;
  return (
    <section className={s.panel} aria-labelledby="hist-t">
      <h2 id="hist-t" className={s.eyebrow}>
        Historial
      </h2>
      {vacio ? (
        <p className={s.nota}>Aún no hay actividad de sincronización.</p>
      ) : (
        <ul className={k.lista} aria-label="Historial de sincronización">
          {props.resueltos > 0 ? (
            <li className={k.evento}>
              <span className={k.bolitaTono.resuelto} aria-hidden="true" />
              <span className={k.eventoTexto}>
                <span className={k.eventoFrase}>
                  Marcaste {registros(props.resueltos)} como{' '}
                  {props.resueltos === 1 ? 'resuelto' : 'resueltos'}.
                </span>
                <span className={k.eventoCuando}>Hoy, hace un momento</span>
              </span>
            </li>
          ) : null}
          {props.eventos.map((e) => (
            <li key={`${e.tipo}-${e.dispositivo ?? ''}-${e.at}`} className={k.evento}>
              <span className={k.bolitaTono[e.tipo]} aria-hidden="true" />
              <span className={k.eventoTexto}>
                <span className={k.eventoFrase}>{describirEvento(e)}</span>
                <span className={k.eventoCuando}>{fechaHoraLarga(e.at)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
