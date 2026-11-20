'use client';

import { createContext, useContext, useState } from 'react';

import doormanImg from './don-cuentas-portero.webp';
import * as d from './door.css';
import * as v from './vale.css';

/**
 * «La trastienda» — the frame of every sign-in page (the entrance and the
 * enrolment link, ADR-160). Don Cuentas stands at the door and reacts to the
 * ceremony: he waits for the key, frowns at one that does not fit.
 *
 * The bubble is flavour, not information — errors are always announced by the
 * page's own notice, and the bubble never repeats or refines them (it must not
 * hint whether a passkey belongs to the team). Lines from boards CD-20/20b.
 */
export type Mood =
  | 'idle'
  | 'esperando'
  | 'cancelada'
  | 'rechazada'
  | 'bloqueada'
  | 'nuevo'
  | 'registrando'
  | 'noCreada'
  | 'lista'
  | 'vencido'
  | 'usado';

const LINES: Readonly<Record<Mood, string>> = {
  idle: '¿Quién anda ahí? Ah, eres del equipo. Pásale.',
  esperando: 'Ándale, enséñame la llave.',
  cancelada: '¿Te arrepentiste? La puerta sigue abierta.',
  rechazada: 'Mmm. Esas cuentas no me cuadran.',
  bloqueada: 'Tranquilo. Aquí la puerta se toma su tiempo.',
  nuevo: 'Primera vez por aquí. Vamos a darte tu llave.',
  registrando: 'Ándale, que ya casi.',
  noCreada: '¿Te arrepentiste? El enlace todavía sirve.',
  lista: 'Ahora sí, ya eres de la casa.',
  vencido: 'Llegaste tarde, pero no pasa nada.',
  usado: 'Mmm. Ese vale ya pasó por aquí.',
};

const MoodContext = createContext<(mood: Mood) => void>(() => undefined);

/** Lets the page inside the frame change Don Cuentas's mood. */
export function useDonCuentas(): (mood: Mood) => void {
  return useContext(MoodContext);
}

/** The left half: the brand, Don Cuentas and what he says. */
function Door({ mood }: { readonly mood: Mood }) {
  return (
    <section className={d.door} aria-label="Don Cuentas cuida la puerta">
      <div className={d.brandRow}>
        <span className={d.wordmark}>XANGARRO!</span>
        <span className={d.badge}>Backoffice</span>
      </div>
      <div className={d.stage}>
        <p key={mood} className={d.bubble}>
          {LINES[mood]}
        </p>
        <div className={d.portrait}>
          <img
            className={d.doorman}
            src={doormanImg.src}
            width={640}
            height={640}
            alt="Don Cuentas, con su tabla, cuidando la puerta"
          />
        </div>
      </div>
      <div className={d.tagline}>
        <p className={d.taglineTitle}>La trastienda.</p>
        <p className={d.taglineBody}>
          Aquí atendemos a los que atienden. Si no eres del equipo, aquí solo hay cajas de refresco.
        </p>
      </div>
    </section>
  );
}

export function Trastienda({
  mood: initial,
  children,
}: {
  readonly mood: Mood;
  readonly children: React.ReactNode;
}) {
  const [mood, setMood] = useState<Mood>(initial);
  return (
    <MoodContext.Provider value={setMood}>
      <main className={d.page} data-mood={mood}>
        <Door mood={mood} />
        <section className={v.counter}>
          {children}
          <p className={v.footnote}>
            Aquí no hay contraseñas. Tu huella y tu cara nunca salen de tu equipo.
          </p>
        </section>
      </main>
    </MoodContext.Provider>
  );
}

/** The «vale de entrada»: a stub with the heading, a tear line, the form. */
export function Vale({
  eyebrow,
  title,
  titleId,
  intro,
  children,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly titleId: string;
  readonly intro?: React.ReactNode;
  readonly children: React.ReactNode;
}) {
  return (
    <div className={v.ticketWrap}>
      <div className={v.stamp} aria-hidden="true">
        <span className={v.stampSmall}>Solo</span>
        <span className={v.stampBig}>EQUIPO</span>
        <span className={v.stampSmall}>Xangarro</span>
      </div>
      <section className={v.ticket} aria-labelledby={titleId}>
        <div className={v.stub}>
          <span className={v.eyebrow}>{eyebrow}</span>
          <h1 id={titleId} className={v.title}>
            {title}
          </h1>
          {intro === undefined ? null : <p className={v.intro}>{intro}</p>}
        </div>
        <div className={v.perforation} aria-hidden="true" />
        <div className={v.tear}>{children}</div>
      </section>
    </div>
  );
}
