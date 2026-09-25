'use client';

import { useActionState, useEffect, useState } from 'react';

import { FormStatus } from '@/components/form-status';
import * as c from '@/components/trastienda/controls.css';
import { ArrowIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '@/components/trastienda/icons';
import { useDonCuentas, type Mood } from '@/components/trastienda/trastienda';
import { login } from '@/server/actions/auth';
import type { FormState } from '@/server/actions/form-state';
import { field, label, muted, stack } from '@/styles/ui.css';

type Focus = 'email' | 'password' | null;

interface FieldEvents {
  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onChange: () => void;
}

function moodFor(focus: Focus, showPassword: boolean, refused: boolean): Mood {
  if (refused) return 'error';
  if (focus === 'password') return showPassword ? 'peek' : 'password';
  return focus ?? 'idle';
}

function EmailField(events: FieldEvents) {
  return (
    <label className={field}>
      <span className={label}>Correo del equipo</span>
      <span className={c.inputWrap}>
        <MailIcon className={c.inputIcon} />
        <input
          className={c.input}
          name="email"
          type="email"
          autoComplete="username"
          placeholder="tu.nombre@xangarro.mx"
          required
          {...events}
        />
      </span>
    </label>
  );
}

function PasswordField({
  shown,
  onToggle,
  ...events
}: FieldEvents & { readonly shown: boolean; readonly onToggle: () => void }) {
  return (
    <label className={field}>
      <span className={label}>Contraseña</span>
      <span className={c.inputWrap}>
        <LockIcon className={c.inputIcon} />
        <input
          className={c.inputWithToggle}
          name="password"
          type={shown ? 'text' : 'password'}
          autoComplete="current-password"
          required
          {...events}
        />
        <button
          type="button"
          className={c.reveal}
          aria-label={shown ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={shown}
          // Keep the caret in the field, so Don Cuentas keeps his hands up.
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggle}
        >
          {shown ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
    </label>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  const [focus, setFocus] = useState<Focus>(null);
  const [shown, setShown] = useState(false);
  // Don Cuentas frowns at a refusal until either field changes.
  const [dismissed, setDismissed] = useState<FormState>(null);
  const refused = state !== null && !state.ok && state !== dismissed;
  const setMood = useDonCuentas();

  useEffect(() => {
    setMood(moodFor(focus, shown, refused));
  }, [focus, shown, refused, setMood]);

  const common = { onBlur: () => setFocus(null), onChange: () => setDismissed(state) };
  return (
    <form action={action} className={stack}>
      <EmailField onFocus={() => setFocus('email')} {...common} />
      <PasswordField
        shown={shown}
        onToggle={() => setShown((v) => !v)}
        onFocus={() => setFocus('password')}
        {...common}
      />
      <FormStatus state={state} />
      <button className={c.cta} type="submit" disabled={pending}>
        {pending ? 'Revisando…' : 'Abrir la trastienda'}
        <ArrowIcon />
      </button>
      <p className={muted}>¿Se te olvidó la contraseña? Pídele a un admin que te la restablezca.</p>
    </form>
  );
}
