'use client';

import type { WizardAnswers } from '@xangarro/domain';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Banner, Button, Card } from '@/components';
import { normalizeWhatsapp } from '@/onboarding/choices';
import { OnboardingFrame, Progress } from '@/onboarding/ui/frame';
import { actions, push, stack } from '@/onboarding/ui/onboarding.css';
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

export function Wizard(props: WizardProps) {
  const w = useWizard(props);
  const step = STEPS[w.index];
  return (
    <OnboardingFrame
      title="Platícanos de ti"
      subtitle="Ocho preguntas rápidas. Puedes omitir cualquiera."
    >
      <Progress value={w.index + 1} max={TOTAL_STEPS} label={stepLabel(w.index)} />
      <Card>
        <div className={stack}>
          <div>
            <h2 style={{ margin: 0 }}>{step?.title}</h2>
            <p style={{ margin: '4px 0 0' }}>{step?.hint}</p>
          </div>
          <StepBody index={w.index} draft={w.draft} stored={w.answers} set={w.set} />
          {w.error ? <Banner tone="critical" title={w.error} /> : null}
          <div className={actions}>
            {w.index > 0 ? (
              <Button variant="ghost" onClick={w.back} disabled={w.pending}>
                Atrás
              </Button>
            ) : null}
            <span className={push} />
            <Button variant="secondary" onClick={() => w.save(true)} disabled={w.pending}>
              Omitir
            </Button>
            <Button onClick={() => w.save(false)} disabled={w.pending} data-testid="wizard-next">
              {w.index === TOTAL_STEPS - 1 ? 'Terminar' : 'Siguiente'}
            </Button>
          </div>
        </div>
      </Card>
    </OnboardingFrame>
  );
}
