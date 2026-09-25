'use client';

import { useActionState } from 'react';

import { FormStatus } from '@/components/form-status';
import { confirmTotp, type EnrolState } from '@/server/actions/mfa';
import { cta } from '@/components/trastienda/controls.css';
import { body, button, stack } from '@/styles/ui.css';

import { CodeField } from '../code-field';
import { codeList } from '../mfa.css';

function RecoveryCodes({ codes }: { readonly codes: readonly string[] }) {
  return (
    <div className={stack}>
      <p className={body}>
        Cada código sirve una sola vez, si pierdes tu teléfono. No los volveremos a mostrar:
        guárdalos en tu gestor de contraseñas.
      </p>
      <ol className={codeList} aria-label="Códigos de recuperación">
        {codes.map((c) => (
          <li key={c}>
            <code>{c}</code>
          </li>
        ))}
      </ol>
      <p className={body}>Cuando tu app muestre el siguiente código, continúa para entrar.</p>
      <a className={button} href="/mfa/verify">
        Ya los guardé — continuar
      </a>
    </div>
  );
}

export function EnrolForm() {
  const [state, action, pending] = useActionState<EnrolState, FormData>(confirmTotp, null);
  if (state !== null && 'recoveryCodes' in state) {
    return (
      <>
        <FormStatus state={state} />
        <RecoveryCodes codes={state.recoveryCodes} />
      </>
    );
  }
  return (
    <form action={action} className={stack}>
      <CodeField caption="Código de 6 dígitos" allowRecovery={false} />
      <FormStatus state={state} />
      <button className={cta} type="submit" disabled={pending}>
        {pending ? 'Verificando…' : 'Registrar'}
      </button>
    </form>
  );
}
