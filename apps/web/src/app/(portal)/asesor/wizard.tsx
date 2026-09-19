'use client';

import { useState } from 'react';
import { formatMoney } from '@xangarro/domain';

import { Banner, Button, Card, OptionCards, type OptionDef } from '@/components';
import { fijarMetaAction } from '@/server/actions/metas';
import type { NivelPosible } from '@/server/metas';
import { eyebrow } from '@/styles/text.css';

import { capName } from './asesor.css';

const GROUP_A: readonly OptionDef[] = [
  {
    value: 'ganar',
    title: 'Ganar más',
    description: 'Que te quede más dinero a ti al final del mes.',
  },
  { value: 'vender', title: 'Vender más', description: 'Subir tus ventas del mes.' },
  { value: 'gastar', title: 'Gastar menos', description: 'Bajar lo que se te va en gastos.' },
];
const GROUP_B: readonly OptionDef[] = [
  {
    value: 'comprar',
    title: 'Comprar algo para mi local',
    description: 'Un equipo, mueble o mejora para tu negocio.',
  },
  { value: 'colchon', title: 'Tener un colchón', description: 'Ahorro para las semanas flojas.' },
  { value: 'deudas', title: 'Pagar deudas', description: 'Liquidar lo que debe tu negocio.' },
];

/**
 * The three-step wizard (P-27). «Qué tanto» shows the levels computed from the
 * last complete month — `loadMetasPage` anchors them — and the save goes
 * through `FijarMetaUseCase`, which re-checks everything server-side.
 */
/** The three step bodies; state stays in the wizard. */
interface PasoState {
  readonly niveles?: readonly NivelPosible[];
  readonly what: string | null;
  readonly setWhat: (v: string) => void;
  readonly why: string | null;
  readonly setWhy: (v: string) => void;
  readonly level: string | null;
  readonly setLevel: (v: string) => void;
}

function PasoQue({ s }: { readonly s: PasoState }) {
  return (
    <>
      <h2 className={capName}>¿Qué quieres lograr?</h2>
      <OptionCards
        ariaLabel="Qué quieres lograr"
        options={GROUP_A}
        value={s.what}
        onValueChange={s.setWhat}
      />
    </>
  );
}

function PasoPorQue({ s }: { readonly s: PasoState }) {
  return (
    <>
      <h2 className={capName}>¿Para qué?</h2>
      <OptionCards ariaLabel="Para qué" options={GROUP_B} value={s.why} onValueChange={s.setWhy} />
    </>
  );
}

function PasoNivel({ s }: { readonly s: PasoState }) {
  return (
    <>
      <h2 className={capName}>¿Qué tanto?</h2>
      <OptionCards
        ariaLabel="Qué tanto"
        options={(s.niveles ?? []).map((n) => ({
          value: n.id,
          title: NIVEL_TITULO[n.id] ?? `+${n.pct}%`,
          description: `${formatMoney(n.mensual)} al mes · ${formatMoney(n.diario)} al día`,
        }))}
        value={s.level}
        onValueChange={s.setLevel}
      />
    </>
  );
}

function PasoWizard(p: {
  readonly step: number;
  readonly niveles: readonly NivelPosible[];
  readonly s: PasoState;
}) {
  if (p.step === 1) return <PasoQue s={p.s} />;
  if (p.step === 2) return <PasoPorQue s={p.s} />;
  return <PasoNivel s={{ ...p.s, niveles: p.niveles }} />;
}

const NIVEL_TITULO: Readonly<Record<string, string>> = {
  empujon: 'Un empujón · +10%',
  reto: 'Un reto · +20%',
  ambicioso: 'Ambicioso · +30%',
};

/** Atrás/Continuar/Empezar — the three-step footer. */
function PieWizard({
  step,
  atras,
  seguir,
  empezar,
}: {
  readonly step: number;
  readonly atras: () => void;
  readonly seguir: () => void;
  readonly empezar: () => void;
}) {
  return (
    <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {step > 1 ? (
        <Button variant="ghost" onClick={atras}>
          Atrás
        </Button>
      ) : null}
      <Button onClick={step === 3 ? empezar : seguir}>
        {step === 3 ? 'Empezar mi meta' : 'Continuar'}
      </Button>
    </div>
  );
}

/** Wizard state and the save, so the component stays layout. */
function useWizard(onDone: () => void) {
  const [step, setStep] = useState(1);
  const [what, setWhat] = useState<string | null>('vender');
  const [why, setWhy] = useState<string | null>('comprar');
  const [level, setLevel] = useState<string | null>('reto');
  const [error, setError] = useState<string | null>(null);

  const empezar = async () => {
    const r = await fijarMetaAction({
      objetivo: what as 'ganar',
      motivo: why as 'comprar',
      nivel: level as 'reto',
    });
    if (!r.ok) return setError(r.message);
    onDone();
  };
  return { step, setStep, what, setWhat, why, setWhy, level, setLevel, error, empezar };
}

export function Wizard({
  niveles,
  onDone,
}: {
  readonly niveles: readonly NivelPosible[];
  readonly onDone: () => void;
}) {
  const w = useWizard(onDone);

  return (
    <Card>
      <div className={eyebrow}>Paso {w.step} de 3</div>
      <PasoWizard step={w.step} niveles={niveles} s={{ ...w, niveles }} />
      {w.error ? <Banner tone="critical" title={w.error} /> : null}
      <PieWizard
        step={w.step}
        atras={() => w.setStep(w.step - 1)}
        seguir={() => w.setStep(w.step + 1)}
        empezar={() => void w.empezar()}
      />
    </Card>
  );
}
