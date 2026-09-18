import type { FormState } from '@/server/actions/form-state';
import { errorText, okText } from '@/styles/ui.css';

/** The result line under a form: announced to screen readers, coloured by outcome. */
export function FormStatus({ state }: { readonly state: FormState }) {
  if (state === null) return null;
  return (
    <p role={state.ok ? 'status' : 'alert'} className={state.ok ? okText : errorText}>
      {state.message}
    </p>
  );
}
