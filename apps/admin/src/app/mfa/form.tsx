'use client';

import { useActionState } from 'react';

import { FormStatus } from '@/components/form-status';
import { verifyTotp } from '@/server/actions/mfa';
import { button, field, input, label, stack } from '@/styles/ui.css';

export function TotpForm({ factorId }: { readonly factorId: string }) {
  const [state, action, pending] = useActionState(verifyTotp, null);
  return (
    <form action={action} className={stack}>
      <input type="hidden" name="factorId" value={factorId} />
      <label className={field}>
        <span className={label}>Código de 6 dígitos</span>
        <input
          className={input}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
        />
      </label>
      <FormStatus state={state} />
      <button className={button} type="submit" disabled={pending}>
        {pending ? 'Verificando…' : 'Verificar'}
      </button>
    </form>
  );
}
