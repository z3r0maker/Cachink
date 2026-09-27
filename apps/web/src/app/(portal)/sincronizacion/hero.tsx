'use client';

import { Don } from '@/components';

import * as s from './sincronizacion.css';

/**
 * The sync status in one sentence: amber with Don worried while records wait
 * for review, green with Don celebrating when every caja is up to date.
 * `data-pendientes` is the count the header pill must agree with.
 */
const registros = (n: number) =>
  n === 1 ? '1 registro no se pudo guardar' : `${n} registros no se pudieron guardar`;

function subAlDia(cajas: number): string {
  if (cajas === 0) return 'Cuando vincules una caja, aquí verás lo que envía.';
  if (cajas === 1) return 'Tu caja envió todo lo que registró.';
  return `Tus ${cajas} cajas enviaron todo lo que registraron.`;
}

export function SyncHero(props: {
  readonly pendientes: number;
  readonly cajas: number;
  readonly mayWrite: boolean;
}) {
  const hay = props.pendientes > 0;
  const titulo = hay
    ? `${registros(props.pendientes)}. Siguen en la caja, nada se pierde.`
    : 'Todo al día. Tus números están completos.';
  const sub = !hay
    ? subAlDia(props.cajas)
    : props.mayWrite
      ? 'Revísalos abajo y márcalos cuando ya estén resueltos.'
      : 'Quien administra el negocio puede marcarlos como resueltos.';
  return (
    <section
      className={hay ? s.heroTono.pendiente : s.heroTono.alDia}
      role="status"
      aria-live="polite"
      data-testid="sync-estado"
      data-pendientes={props.pendientes}
    >
      <span className={s.heroDon}>
        <Don pose={hay ? 'preocupado' : 'celebrando'} size={58} />
      </span>
      <span className={s.heroTexto}>
        <span className={s.heroTitulo}>{titulo}</span>
        <span className={s.heroSub}>{sub}</span>
      </span>
      {hay ? (
        <a href="#por-revisar" className={s.revisar}>
          Revisar
        </a>
      ) : null}
    </section>
  );
}
