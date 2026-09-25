'use client';

import { useActionState, useEffect, useState } from 'react';

import { FormStatus } from '@/components/form-status';
import { ShieldIcon } from '@/components/trastienda/icons';
import { useDonCuentas } from '@/components/trastienda/trastienda';
import { cta } from '@/components/trastienda/controls.css';
import { verifyCode } from '@/server/actions/mfa';
import type { FormState } from '@/server/actions/form-state';
import { stack } from '@/styles/ui.css';

import { CodeField } from '../code-field';

export function VerifyForm() {
  const [state, action, pending] = useActionState(verifyCode, null);
  // Don Cuentas frowns at a refused code until the field changes.
  const [dismissed, setDismissed] = useState<FormState>(null);
  const refused = state !== null && !state.ok && state !== dismissed;
  const setMood = useDonCuentas();

  useEffect(() => {
    setMood(refused ? 'error' : 'otp');
  }, [refused, setMood]);

  return (
    <form action={action} className={stack}>
      <CodeField caption="Código" allowRecovery onChange={() => setDismissed(state)} />
      <FormStatus state={state} />
      <button className={cta} type="submit" disabled={pending}>
        <ShieldIcon />
        {pending ? 'Verificando…' : 'Verificar y entrar'}
      </button>
    </form>
  );
}
