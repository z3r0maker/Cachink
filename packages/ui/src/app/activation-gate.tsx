/**
 * ActivationGate — the first gate after hydration (A-04; Vincular, M-06). An unactivated
 * device sees only the activation screen; an activated one falls through to
 * the rest of GatedNavigation (operator sign-in and the app).
 */

import type { ReactElement, ReactNode } from 'react';
import { ActivationScreen } from '../screens/Activation/index';
import { useAbrirApp, useActivate } from '../activation/use-activate';
import { useDescargaInicial } from '../activation/use-descarga';
import { useActivationState } from '../activation/use-activation-state';

export function ActivationGate(props: { readonly children: ReactNode }): ReactElement | null {
  const { record } = useActivationState();
  const abrir = useAbrirApp();
  // DS-10: a big business's remaining pages come before the app opens.
  const d = useDescargaInicial(abrir);
  const activate = useActivate({ onFaltanPaginas: d.bajar });
  if (record === undefined) return null;
  if (record !== null) return <>{props.children}</>;
  return (
    <ActivationScreen
      onSubmit={(input) => activate.mutate(input)}
      onScan={(qrToken) => activate.mutate({ qrToken })}
      submitting={activate.isPending}
      errorKey={activate.error?.key ?? null}
      descarga={d.descarga}
      onReintentar={d.bajar}
    />
  );
}
