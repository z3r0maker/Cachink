'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

import { errorText, field, fieldGroup, label } from '@/components/input.css';

import { caja, ojo, pistaCampo } from './contrasena.css';

export interface CampoContrasenaProps {
  readonly etiqueta: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly autoComplete: 'new-password' | 'current-password';
  readonly testId: string;
  /** The live hint under the field; replaced by `error` when there is one. */
  readonly pista?: ReactNode;
  readonly error?: string;
  /** Lets two fields share one show/hide state (restablecer). */
  readonly visible?: boolean;
  readonly onVisible?: (v: boolean) => void;
}

function Bajo(p: { readonly id: string; readonly error?: string; readonly pista?: ReactNode }) {
  if (p.error)
    return (
      <p id={`${p.id}-error`} className={errorText}>
        {p.error}
      </p>
    );
  if (!p.pista) return null;
  return (
    <div id={`${p.id}-pista`} className={pistaCampo} aria-live="polite">
      {p.pista}
    </div>
  );
}

/**
 * A password input with a 44px show/hide button inside its right edge. Same
 * field, label and error styles as the shared `Input`; the button is a real
 * toggle (`aria-pressed`) with its own label.
 */
export function CampoContrasena(p: CampoContrasenaProps) {
  const id = useId();
  const [propio, setPropio] = useState(false);
  const visible = p.visible ?? propio;
  const setVisible = p.onVisible ?? setPropio;
  const bajo = p.error ? `${id}-error` : p.pista ? `${id}-pista` : undefined;
  return (
    <div className={fieldGroup}>
      <label className={label} htmlFor={id}>
        {p.etiqueta}
      </label>
      <div className={caja}>
        <input
          id={id}
          className={field}
          type={visible ? 'text' : 'password'}
          autoComplete={p.autoComplete}
          value={p.value}
          onChange={(e) => p.onChange(e.target.value)}
          aria-invalid={p.error ? true : undefined}
          aria-describedby={bajo}
          data-testid={p.testId}
        />
        <button
          type="button"
          className={ojo}
          aria-pressed={visible}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
      <Bajo id={id} error={p.error} pista={p.pista} />
    </div>
  );
}
