import { Don } from '@/components';
import { button } from '@/components/button.css';

import type { Briefing } from './briefing';
import * as s from './hoy.css';

/**
 * Hoy's lead (ADR-107): Don Cuentas waves, greets the owner by name, and says
 * in one line how the month is going, with the one action that follows.
 */
export function HoyHero(props: {
  readonly saludo: string;
  readonly fecha: string;
  readonly briefing: Briefing;
  readonly extra?: React.ReactNode;
}) {
  return (
    <section className={s.hero} aria-labelledby="hoy-saludo">
      <div className={s.heroStage}>
        <Don pose="hola" size={220} alt="Don Cuentas te saluda" />
      </div>
      <div className={s.heroBody}>
        <span className={s.eyebrow}>Don Cuentas · {props.fecha}</span>
        <h1 id="hoy-saludo" className={s.heroTitle}>
          {props.saludo}
        </h1>
        <p className={s.heroLine}>{props.briefing.line}</p>
        <div className={s.heroActions}>
          <a className={button({ variant: 'primary' })} href={props.briefing.cta.href}>
            {props.briefing.cta.label}
          </a>
          <a className={button({ variant: 'secondary' })} href="#pendientes">
            Ver lo pendiente
          </a>
          {props.extra}
        </div>
      </div>
    </section>
  );
}
