'use client';

import { useActionState } from 'react';

import { FormStatus } from '@/components/form-status';
import { verifyCode } from '@/server/actions/mfa';
import { button, stack } from '@/styles/ui.css';

import { CodeField } from '../code-field';

export function VerifyForm() {
  const [state, action, pending] = useActionState(verifyCode, null);
  return (
    <form action={action} className={stack}>
      <CodeField caption="Código" allowRecovery />
      <FormStatus state={state} />
      <button className={button} type="submit" disabled={pending}>
        {pending ? 'Verificando…' : 'Verificar'}
      </button>
    </form>
  );
}
