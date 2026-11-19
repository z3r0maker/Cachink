/**
 * CajaGateBanner — what Cobrar shows when no CajaTurno is open: the turno
 * opens from here (board MvTurnoCerrado). Double-protection: the use case
 * also throws CajaNoAbiertaError if checkout is somehow reached without one.
 */
import type { ReactElement } from 'react';
import { TurnoCerrado } from '../AbrirTurno/turno-cerrado';

export interface CajaGateBannerProps {
  readonly onAbrirTurno: () => void;
  readonly testID?: string;
}

export function CajaGateBanner(props: CajaGateBannerProps): ReactElement {
  return (
    <TurnoCerrado
      pantalla="cobrar"
      onAbrir={props.onAbrirTurno}
      testID={props.testID ?? 'caja-gate-banner'}
    />
  );
}
