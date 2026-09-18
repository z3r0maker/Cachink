'use client';

import { useActionState } from 'react';

import { FormStatus } from '@/components/form-status';
import { login } from '@/server/actions/auth';
import { button, field, input, label, stack } from '@/styles/ui.css';

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className={stack}>
      <label className={field}>
        <span className={label}>Correo</span>
        <input className={input} name="email" type="email" autoComplete="username" required />
      </label>
      <label className={field}>
        <span className={label}>Contraseña</span>
        <input
          className={input}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <FormStatus state={state} />
      <button className={button} type="submit" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
