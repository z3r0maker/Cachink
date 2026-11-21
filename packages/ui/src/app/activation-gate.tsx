/**
 * ActivationGate — the first gate after hydration (A-04; Vincular, M-06). An unactivated
 * device sees only the activation screen; an activated one falls through to
 * the rest of GatedNavigation (operator sign-in and the app).
 */

import type { ReactElement, ReactNode } from 'react';
import { ActivationScreen } from '../screens/Activation/index';
import { useActivate } from '../activation/use-activate';
import { useActivatePreview } from '../activation/use-activate-preview';
import { useActivationState } from '../activation/use-activation-state';
import { useAvisoBorrado } from '../activation/use-aviso-borrado';
import { useEnlaceVinculacion } from '../activation/use-enlace-vinculacion';
import { useMarcarArranqueListo } from './splash/arranque';

/**
 * Mounted only while the phone is not linked, so a pairing link is listened
 * for exactly then. A read token is previewed first («¿Es tu negocio?»,
 * N-25) and redeemed only on «Conectar esta caja».
 */
function Vincular(props: { readonly borrado: boolean }): ReactElement {
  const activate = useActivate();
  const previa = useActivatePreview();
  const enlace = useEnlaceVinculacion();
  return (
    <ActivationScreen
      onSubmit={(input) => activate.mutate(input)}
      onScan={(qrToken) => activate.mutate({ qrToken })}
      onLeer={previa.leer}
      onSoltar={previa.soltar}
      vistaPrevia={previa.vista}
      enlace={enlace}
      submitting={activate.isPending}
      errorKey={activate.error?.key ?? null}
      borrado={props.borrado}
    />
  );
}

export function ActivationGate(props: { readonly children: ReactNode }): ReactElement | null {
  const { record } = useActivationState();
  const borrado = useAvisoBorrado();
  // Not linked: the connect screen is the first real screen, the splash may go.
  useMarcarArranqueListo(record === null);
  if (record === undefined) return null;
  if (record !== null) return <>{props.children}</>;
  return <Vincular borrado={borrado} />;
}
