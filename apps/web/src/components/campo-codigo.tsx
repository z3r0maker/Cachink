import { useId } from 'react';

import { codigo, sinMargen } from './campo-codigo.css';
import { errorText, field, fieldGroup, label } from './input.css';

export interface CampoCodigoProps {
  /** `app`: six digits from the authenticator. `recuperacion`: one of the ten saved codes. */
  readonly modo: 'app' | 'recuperacion';
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error?: string | undefined;
  readonly disabled?: boolean;
  readonly autoFocus?: boolean;
  readonly testId?: string;
}

const ETIQUETA = { app: 'Código de 6 dígitos', recuperacion: 'Código de recuperación' } as const;

/**
 * The one field every second-factor step uses (N-83): at sign-in, when turning
 * it on, and in the re-ask dialog. `one-time-code` lets a phone offer the code;
 * a recovery code is typed as it was saved, dashes or not.
 */
export function CampoCodigo(p: CampoCodigoProps) {
  const id = useId();
  const app = p.modo === 'app';
  return (
    <div className={`${fieldGroup} ${sinMargen}`}>
      <label className={label} htmlFor={id}>
        {ETIQUETA[p.modo]}
      </label>
      <input
        id={id}
        className={`${field} ${codigo[p.modo]}`}
        name="codigo"
        type="text"
        inputMode={app ? 'numeric' : 'text'}
        autoComplete={app ? 'one-time-code' : 'off'}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={app ? 7 : 24}
        placeholder={app ? undefined : 'abcd-efgh-ijkl-mnop'}
        value={p.value}
        onChange={(ev) => p.onChange(ev.target.value)}
        disabled={p.disabled}
        autoFocus={p.autoFocus}
        aria-invalid={p.error ? true : undefined}
        aria-describedby={p.error ? `${id}-error` : undefined}
        data-testid={p.testId}
      />
      {p.error ? (
        <p id={`${id}-error`} className={errorText} role="alert">
          {p.error}
        </p>
      ) : null}
    </div>
  );
}
