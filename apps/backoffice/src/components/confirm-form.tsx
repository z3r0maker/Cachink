'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';

import { FormStatus } from '@/components/form-status';
import type { FormState } from '@/server/actions/form-state';
import { body, button, buttonQuiet, heading, stack } from '@/styles/ui.css';
import { dialog, dialogActions } from '@/styles/dialog.css';

interface Props {
  readonly action: (prev: FormState, form: FormData) => Promise<FormState>;
  /** The button that opens the confirmation, e.g. «Regalar plan…». */
  readonly trigger: string;
  /** What will happen, built from the filled-in form when the dialog opens. */
  readonly describe: (form: FormData) => string;
  readonly children: React.ReactNode;
  /**
   * Posted by «Confirmar» only, so the server can tell a confirmed submit
   * from a direct one (e.g. `confirmacion=apagar` for a global switch-off).
   */
  readonly confirmField?: { readonly name: string; readonly value: string };
}

function ConfirmButton(p: { readonly pending: boolean; readonly field: Props['confirmField'] }) {
  return (
    <button
      className={button}
      type="submit"
      disabled={p.pending}
      name={p.field?.name}
      value={p.field?.value}
    >
      {p.pending ? 'Guardando…' : 'Confirmar'}
    </button>
  );
}

/**
 * A console form whose submit goes through a confirmation `<dialog>`: the
 * first button only validates and opens it; «Confirmar» inside it submits.
 * For every mutation that changes what a customer is entitled to.
 */
export function ConfirmForm(props: Props) {
  const [state, action, pending] = useActionState(props.action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [summary, setSummary] = useState('');
  const titleId = useId();

  useEffect(() => {
    if (state !== null) dialogRef.current?.close();
  }, [state]);

  function open(): void {
    const form = formRef.current;
    if (!form?.reportValidity()) return;
    setSummary(props.describe(new FormData(form)));
    dialogRef.current?.showModal();
  }

  return (
    <form ref={formRef} action={action} className={stack}>
      {props.children}
      <button className={button} type="button" onClick={open} disabled={pending}>
        {props.trigger}
      </button>
      <dialog ref={dialogRef} className={dialog} aria-labelledby={titleId}>
        <h2 id={titleId} className={heading}>
          ¿Confirmas?
        </h2>
        <p className={body}>{summary}</p>
        <div className={dialogActions}>
          <ConfirmButton pending={pending} field={props.confirmField} />
          <button className={buttonQuiet} type="button" onClick={() => dialogRef.current?.close()}>
            Cancelar
          </button>
        </div>
      </dialog>
      <FormStatus state={state} />
    </form>
  );
}
