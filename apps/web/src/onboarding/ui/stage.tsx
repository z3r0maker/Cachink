import type { ReactNode } from 'react';

import { Don } from '@/components';
import type { DonLine } from '@/onboarding/don-lines';

import * as s from './stage.css';

type Estado = 'hecho' | 'actual' | 'falta';

/** One segment per question: done in black, the current one yellow. */
function Segments({ done, total }: { readonly done: number; readonly total: number }) {
  const estados: Estado[] = Array.from({ length: total }, (_, i) =>
    i < done ? 'hecho' : i === done ? 'actual' : 'falta',
  );
  return (
    <div className={s.segments} aria-hidden="true">
      {estados.map((e, i) => (
        <span key={i} className={s.segment[e]} />
      ))}
    </div>
  );
}

export interface StageProps {
  /** «Platícanos de ti», or the plan step's name. */
  readonly fase: string;
  /** «Paso 3 de 8»; shown beside the bar and read by screen readers. */
  readonly paso: string;
  readonly done: number;
  readonly total: number;
  readonly don: DonLine;
  readonly children: ReactNode;
}

/**
 * The onboarding stage (ADR-107): progress on top, Don Cuentas's line on the
 * yellow side, the question and its answers on the other.
 */
export function Stage(props: StageProps) {
  return (
    <div className={s.page}>
      <header className={s.top}>
        <span className={s.brand}>
          <span className={s.wordmark}>XANGARRO!</span>
        </span>
        <div
          className={s.progress}
          role="progressbar"
          aria-label={props.paso}
          aria-valuemin={0}
          aria-valuemax={props.total}
          aria-valuenow={props.done}
        >
          <div className={s.progressText}>
            <span>{props.fase}</span>
            <span className={s.muted}>{props.paso}</span>
          </div>
          <Segments done={props.done} total={props.total} />
        </div>
      </header>
      <div className={s.body}>
        <aside className={s.side} aria-label="Don Cuentas">
          <p className={s.bubble} aria-live="polite">
            {props.don.text}
            <svg className={s.tail} viewBox="0 0 30 18" width={30} height={18} aria-hidden="true">
              <path d="M1 0 L15 16 L29 0 Z" className={s.tailFill} />
              <path d="M1 0 L15 16 L29 0" className={s.tailLine} />
            </svg>
          </p>
          <div className={s.donSlot}>
            <Don pose={props.don.pose} size={300} />
          </div>
        </aside>
        <main className={s.main}>{props.children}</main>
      </div>
    </div>
  );
}
