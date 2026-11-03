/**
 * ActivationGate — the first gate after hydration (A-04; Vincular, M-06). An unactivated
 * device sees only the activation screen; an activated one falls through to
 * the rest of GatedNavigation (operator sign-in and the app).
 */

import type { ReactElement, ReactNode } from 'react';
import { ActivationScreen } from '../screens/Activation/index';
import { useActivate } from '../activation/use-activate';
import { useActivationState } from '../activation/use-activation-state';
import { useAvisoBorrado } from '../activation/use-aviso-borrado';

export function ActivationGate(props: { readonly children: ReactNode }): ReactElement | null {
  const { record } = useActivationState();
  const activate = useActivate();
  const borrado = useAvisoBorrado();
  if (record === undefined) return null;
  if (record !== null) return <>{props.children}</>;
  return (
    <ActivationScreen
      onSubmit={(input) => activate.mutate(input)}
      onScan={(qrToken) => activate.mutate({ qrToken })}
      submitting={activate.isPending}
      errorKey={activate.error?.key ?? null}
      borrado={borrado}
    />
  );
}
