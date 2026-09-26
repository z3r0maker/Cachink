'use client';

import { DON_CUENTAS, Don, type DonPose } from '@/components';

import * as s from './hero.css';

const CUANTAS = ['', 'una cosa', 'dos cosas', 'tres cosas', 'cuatro cosas', 'cinco cosas'];

/** «Lo que veo hoy»: what the feed below holds, said in one line. */
function lectura(n: number): {
  readonly pose: DonPose;
  readonly lead: string;
  readonly sub: string;
} {
  if (n === 0) {
    return {
      pose: 'quieto',
      lead: 'Todo en orden por hoy.',
      sub: 'Tus números no me están pidiendo nada. Cuando algo cambie, aquí te lo digo.',
    };
  }
  return {
    pose: 'senalando',
    lead: `Hoy tengo ${CUANTAS[n] ?? `${n} cosas`} para ti.`,
    sub: 'Las saqué de tus registros de esta mañana. Empieza por la de arriba.',
  };
}

const fechaLarga = (iso: string) =>
  new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${iso}T12:00:00Z`),
  );

/**
 * Don Cuentas's own page opens on him (ADR-107): full body, blinking or
 * pointing at what he found, and his read of the day in one sentence. The
 * sentence is counted from the deterministic feed, never written by a model,
 * and the line under it says so.
 */
export function DonHero({
  pendientes,
  hoy,
}: {
  readonly pendientes: number;
  readonly hoy: string;
}) {
  const l = lectura(pendientes);
  return (
    <section className={s.hero}>
      <div className={s.quien}>
        <Don pose={l.pose} size={170} />
        <span className={s.placa}>
          <h1 className={s.nombre}>{DON_CUENTAS}</h1>
          <span className={s.cargo}>Tu contador de cabecera</span>
        </span>
      </div>
      <div className={s.dice}>
        <span className={s.cuando}>Lo que veo hoy · {fechaLarga(hoy)}</span>
        <p className={s.lead}>{l.lead}</p>
        <p className={s.sub}>{l.sub}</p>
        <span className={s.origen}>Calculado a partir de tus registros, cada mañana</span>
      </div>
    </section>
  );
}
