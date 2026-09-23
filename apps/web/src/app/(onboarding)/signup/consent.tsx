'use client';

import { link } from '@/onboarding/ui/onboarding.css';
import { AVISO_INTEGRAL_URL, AVISO_PARRAFOS, TERMINOS_URL } from '@/legal/aviso-simplificado';

import { aviso, avisoTitle, box, check } from './consent.css';

export interface ConsentState {
  /** The express act on aviso + términos: unticked by default, required. */
  readonly acepto: boolean;
  /** Novedades: ticked by default (tacit consent, art. 7 LFPDPPP). */
  readonly novedades: boolean;
}

/** The aviso simplificado (art. 16 II LFPDPPP), shown in full above the button. */
function AvisoBlock() {
  return (
    <div className={aviso} data-testid="signup-aviso" role="note">
      <p className={avisoTitle}>Aviso de privacidad simplificado</p>
      {AVISO_PARRAFOS.map((p) => (
        <p key={p.slice(0, 24)}>{p}</p>
      ))}
      <p>
        Aviso integral y derechos ARCO:{' '}
        <a className={link} href={AVISO_INTEGRAL_URL} target="_blank" rel="noreferrer">
          xangarro.mx/privacidad
        </a>
      </p>
    </div>
  );
}

function Check({
  checked,
  onChange,
  testId,
  children,
}: {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly testId: string;
  readonly children: React.ReactNode;
}) {
  return (
    <label className={check}>
      <input
        type="checkbox"
        className={box}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testId}
      />
      <span>{children}</span>
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
      <Check
        checked={value.acepto}
        onChange={(acepto) => onChange({ acepto })}
        testId="signup-acepto"
      >
        Leí el aviso de privacidad y acepto los{' '}
        <a className={link} href={TERMINOS_URL} target="_blank" rel="noreferrer">
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
        Quiero recibir novedades y consejos de Xangarro.
      </Check>
    </>
  );
}
