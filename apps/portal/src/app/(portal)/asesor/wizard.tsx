'use client';

import { useState } from 'react';
import { formatMoney } from '@xangarro/domain';

import { Button, Card, OptionCards, type OptionDef } from '@/components';
import { GROUP_A, GROUP_B, LEVELS } from '@/fixtures/asesor';
import { eyebrow } from '@/styles/text.css';

import { capName } from './asesor.css';

const toOptions = <T extends string>(
  xs: readonly { readonly id: T; readonly title: string; readonly description: string }[],
): readonly OptionDef[] =>
  xs.map((x) => ({ value: x.id, title: x.title, description: x.description }));

interface StepBodyProps {
  readonly step: number;
  readonly what: string | null;
  readonly setWhat: (v: string) => void;
  readonly why: string | null;
  readonly setWhy: (v: string) => void;
  readonly level: string | null;
  readonly setLevel: (v: string) => void;
}

function StepBody(p: StepBodyProps) {
  if (p.step === 1) {
    return (
      <>
        <h2 className={capName}>¿Qué quieres lograr?</h2>
        <OptionCards
          ariaLabel="Qué quieres lograr"
          options={toOptions(GROUP_A)}
          value={p.what}
          onValueChange={p.setWhat}
        />
      </>
    );
  }
  if (p.step === 2) {
    return (
      <>
        <h2 className={capName}>¿Para qué?</h2>
        <OptionCards
          ariaLabel="Para qué"
          options={toOptions(GROUP_B)}
          value={p.why}
          onValueChange={p.setWhy}
        />
      </>
    );
  }
  return <LevelStep level={p.level} setLevel={p.setLevel} />;
}

function LevelStep({
  level,
  setLevel,
}: {
  readonly level: string | null;
  readonly setLevel: (v: string) => void;
}) {
  return (
    <>
      <h2 className={capName}>¿Qué tanto?</h2>
      <OptionCards
        ariaLabel="Qué tanto"
        options={LEVELS.map((l) => ({
          value: l.id,
          title: l.title,
          description: `${formatMoney(l.monthly)} al mes · ${formatMoney(l.daily)} al día`,
        }))}
        value={level}
        onValueChange={setLevel}
      />
    </>
  );
}

export function Wizard({ onDone }: { readonly onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [what, setWhat] = useState<string | null>('vender');
  const [why, setWhy] = useState<string | null>('comprar');
  const [level, setLevel] = useState<string | null>('reto');

  return (
    <Card>
      <div className={eyebrow}>Paso {step} de 3</div>
      <StepBody
        step={step}
        what={what}
        setWhat={setWhat}
        why={why}
        setWhy={setWhy}
        level={level}
        setLevel={setLevel}
      />
      <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {step > 1 ? (
          <Button variant="ghost" onClick={() => setStep(step - 1)}>
            Atrás
          </Button>
        ) : null}
        <Button onClick={() => (step === 3 ? onDone() : setStep(step + 1))}>
          {step === 3 ? 'Empezar mi meta' : 'Continuar'}
        </Button>
      </div>
    </Card>
  );
}
