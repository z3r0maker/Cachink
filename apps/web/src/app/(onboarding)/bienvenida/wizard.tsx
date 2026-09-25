'use client';

import type { WizardAnswers } from '@xangarro/domain';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Banner, Button } from '@/components';
import { normalizeWhatsapp } from '@/onboarding/choices';
import { INTRO, donLine } from '@/onboarding/don-lines';
import { Stage } from '@/onboarding/ui/stage';
import * as intro from '@/onboarding/ui/intro.css';
import * as s from '@/onboarding/ui/stage.css';
import { StepBody } from '@/onboarding/ui/steps-preguntas';
import { STEPS, TOTAL_STEPS, stepLabel } from '@/onboarding/wizard-steps';
import { guardarPaso } from '@/server/actions/onboarding';

/**
 * "Platícanos de ti" (N-12): the container. It holds the answers the server
 * returned and the current step's draft; every [Siguiente] and [Omitir] is a
 * save, so leaving halfway loses nothing. It renders and submits — the rules
 * are the use case's.
 */
export interface WizardProps {
  readonly initial: WizardAnswers;
  /** Where the last step goes: "Tu plan ideal", or the N-15 review. */
  readonly next: string;
  /** First run only: Don Cuentas introduces himself before question 1. */
  readonly intro?: boolean;
}

/** Blank text is "no answer", not an empty string the schema would refuse. */
function clean(draft: WizardAnswers): WizardAnswers {
  const out: Record<string, unknown> = { ...draft };
  if (typeof out.nombre === 'string' && out.nombre.trim() === '') delete out.nombre;
  if (typeof out.whatsapp === 'string') {
    const phone = normalizeWhatsapp(out.whatsapp);
    if (phone === '') delete out.whatsapp;
    else out.whatsapp = phone;
  }
  if (Array.isArray(out.metodosCobro) && out.metodosCobro.length === 0) delete out.metodosCobro;
  return out as WizardAnswers;
}

function pick(answers: WizardAnswers, index: number): WizardAnswers {
  const keys = STEPS[index]?.keys ?? [];
  return Object.fromEntries(keys.map((k) => [k, answers[k]])) as WizardAnswers;
}

function useWizard(props: WizardProps) {
  const [answers, setAnswers] = useState(props.initial);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState(() => pick(props.initial, 0));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const go = (to: number, from: WizardAnswers) => {
    if (to >= TOTAL_STEPS) return router.push(props.next);
    setIndex(to);
    setDraft(pick(from, to));
  };
  const save = (skip: boolean) =>
    startTransition(async () => {
      const result = await guardarPaso(index, skip ? {} : clean(draft), skip);
      if (!result.ok) return setError(result.message);
      setError(null);
      setAnswers(result.answers);
      go(index + 1, result.answers);
    });
  const set = (patch: WizardAnswers) => setDraft((d) => ({ ...d, ...patch }));
  const back = () => go(Math.max(0, index - 1), answers);
  return { answers, index, draft, error, pending, save, set, back };
}

/** Before the first question: Don Cuentas says hi and says what's coming. */
function Intro({ onStart }: { readonly onStart: () => void }) {
  return (
    <Stage
      fase="Platícanos de ti"
      paso={`${TOTAL_STEPS} preguntas`}
      done={0}
      total={TOTAL_STEPS}
      don={INTRO}
    >
      <span className={s.eyebrow}>Antes de empezar</span>
      <h1 className={s.question}>Platícanos de ti</h1>
      <p className={s.hint}>
        Te voy a hacer {TOTAL_STEPS} preguntas para acomodar Xangarro a tu changarro. Son rápidas,
        puedes omitir cualquiera y cambiarla después en Mi negocio.
      </p>
      <ol className={intro.temario} aria-label="Lo que te vamos a preguntar">
        {STEPS.map((step, i) => (
          <li key={step.title} className={intro.tema}>
            <span className={intro.temaNum} aria-hidden="true">
              {i + 1}
            </span>
            {step.title}
          </li>
        ))}
      </ol>
      <div className={intro.introActions}>
        <Button size="lg" onClick={onStart} autoFocus>
          ¡Va, empecemos!
        </Button>
        <span className={s.muted}>Te toma como 2 minutos.</span>
      </div>
    </Stage>
  );
}

function Actions({ w }: { readonly w: ReturnType<typeof useWizard> }) {
  return (
    <div className={s.actions}>
      {w.index > 0 ? (
        <Button variant="ghost" onClick={w.back} disabled={w.pending}>
          Atrás
        </Button>
      ) : null}
      <span className={s.push} />
      <Button variant="secondary" onClick={() => w.save(true)} disabled={w.pending}>
        Omitir
      </Button>
      <Button onClick={() => w.save(false)} disabled={w.pending} data-testid="wizard-next">
        {w.index === TOTAL_STEPS - 1 ? 'Terminar' : 'Siguiente'}
      </Button>
    </div>
  );
}

export function Wizard(props: WizardProps) {
  const w = useWizard(props);
  const [started, setStarted] = useState(!props.intro);
  if (!started) return <Intro onStart={() => setStarted(true)} />;
  const step = STEPS[w.index];
  return (
    <Stage
      fase="Platícanos de ti"
      paso={stepLabel(w.index)}
      done={w.index}
      total={TOTAL_STEPS}
      don={donLine(w.index)}
    >
      <span className={s.eyebrow}>Pregunta {w.index + 1}</span>
      <h1 className={s.question}>{step?.title}</h1>
      {step?.hint ? <p className={s.hint}>{step.hint}</p> : null}
      <div className={s.answers}>
        <StepBody index={w.index} draft={w.draft} stored={w.answers} set={w.set} />
      </div>
      {w.error ? <Banner tone="critical" title={w.error} /> : null}
      <Actions w={w} />
    </Stage>
  );
}
