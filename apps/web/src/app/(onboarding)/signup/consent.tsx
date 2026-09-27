'use client';

import { ShieldCheck } from 'lucide-react';

import { AVISO_INTEGRAL_URL, AVISO_PARRAFOS, TERMINOS_URL } from '@/legal/aviso-simplificado';

import * as s from './consent.css';

export interface ConsentState {
  /** The express act on aviso + términos: unticked by default, required. */
  readonly acepto: boolean;
  /** Novedades: ticked by default (tacit consent, art. 7 LFPDPPP). */
  readonly novedades: boolean;
}

/**
 * «Qué datos usamos: …» → the lead before the colon in bold. Presentation
 * only: the words are exactly the ones the ledger hashes.
 */
function Parrafo({ texto }: { readonly texto: string }) {
  const corte = texto.indexOf(': ');
  if (corte < 0 || corte > 30) return <p className={s.parrafo}>{texto}</p>;
  return (
    <p className={s.parrafo}>
      <strong className={s.lead}>{texto.slice(0, corte + 1)}</strong>
      {texto.slice(corte + 1)}
    </p>
  );
}

/** The aviso simplificado (art. 16 II LFPDPPP), shown in full above the button. */
function AvisoBlock() {
  return (
    <section className={s.aviso} data-testid="signup-aviso" aria-labelledby="signup-aviso-t">
      <div className={s.avisoCabeza}>
        <span className={s.escudo} aria-hidden="true">
          <ShieldCheck size={18} />
        </span>
        <h2 id="signup-aviso-t" className={s.avisoTitle}>
          Aviso de privacidad simplificado
        </h2>
      </div>
      <div className={s.avisoTexto} role="region" aria-label="Texto del aviso" tabIndex={0}>
        {AVISO_PARRAFOS.map((p) => (
          <Parrafo key={p.slice(0, 24)} texto={p} />
        ))}
        <p className={s.parrafo}>
          <strong className={s.lead}>Aviso integral y derechos ARCO:</strong>{' '}
          <a className={s.enlace} href={AVISO_INTEGRAL_URL} target="_blank" rel="noreferrer">
            xangarro.mx/privacidad
          </a>
        </p>
      </div>
    </section>
  );
}

function Check(props: {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly testId: string;
  readonly children: React.ReactNode;
}) {
  return (
    <label className={s.check}>
      <input
        type="checkbox"
        className={s.box}
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        data-testid={props.testId}
      />
      <span>{props.children}</span>
    </label>
  );
}

/**
 * The aviso and the two controls the ledger records. One affirmative act — the
 * core consent covers datos patrimoniales and must be the person's own (art. 7
 * párrafo quinto); the novedades toggle may default on.
 */
export function Consent({
  value,
  onChange,
}: {
  readonly value: ConsentState;
  readonly onChange: (patch: Partial<ConsentState>) => void;
}) {
  return (
    <>
      <AvisoBlock />
      <div className={s.checks}>
        <Check
          checked={value.acepto}
          onChange={(acepto) => onChange({ acepto })}
          testId="signup-acepto"
        >
          Leí el aviso de privacidad y acepto los{' '}
          <a className={s.enlace} href={TERMINOS_URL} target="_blank" rel="noreferrer">
            Términos
          </a>
          . Consiento expresamente el tratamiento de mis datos, incluidos los patrimoniales y
          financieros, para las finalidades necesarias.
        </Check>
        <Check
          checked={value.novedades}
          onChange={(novedades) => onChange({ novedades })}
          testId="signup-novedades"
        >
          Quiero recibir novedades y consejos de Xangarro.{' '}
          <span className={s.opcional}>Opcional.</span>
        </Check>
      </div>
    </>
  );
}
