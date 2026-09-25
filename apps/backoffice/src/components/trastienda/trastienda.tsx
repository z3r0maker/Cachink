'use client';

import { createContext, useContext, useState } from 'react';

import doormanImg from './don-cuentas-portero.webp';
import noPeekingImg from './don-cuentas-no-veo.webp';
import * as d from './door.css';
import * as v from './vale.css';

/**
 * «La trastienda» — the frame of every sign-in page (login, MFA enrolment,
 * MFA verification). Don Cuentas stands at the door and reacts to the form:
 * he leans in while you type your email and covers his eyes on the password.
 *
 * The bubble is flavour, not information — errors are always announced by the
 * form's own `FormStatus`, and the bubble never repeats or refines them (it
 * must not hint whether the email or the password was wrong).
 */
export type Mood = 'idle' | 'email' | 'password' | 'peek' | 'error' | 'otp' | 'enroll';

const LINES: Readonly<Record<Mood, string>> = {
  idle: '¿Quién anda ahí? Ah, eres del equipo. Pásale.',
  email: 'A ver, a ver… ¿cómo te llamas en el sistema?',
  password: 'No veo, no veo. Yo nomás cuento.',
  peek: 'Oye, ¿para qué la destapas? Yo no me asomo… mucho.',
  error: 'Mmm. Esas cuentas no me cuadran.',
  otp: 'Ya casi. Pásame el código, que aquí no entra cualquiera.',
  enroll: 'Primera vez por aquí. Vamos a ponerle candado a tu cuenta.',
};

const MoodContext = createContext<(mood: Mood) => void>(() => undefined);

/** Lets a form inside the frame change Don Cuentas's mood. */
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
          <img className={d.noPeeking} src={noPeekingImg.src} width={640} height={640} alt="" />
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
          <p className={v.footnote}>Don Cuentas no ve tu contraseña. Ni quiere.</p>
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
