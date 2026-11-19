/**
 * The states Cierre shows besides its count (Track M, M-09): cargando, sin
 * turno abierto (nothing to close) and the failed read. Each says what to
 * do next.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { ErrorState, Spinner } from '../../components/index';
import { TurnoCerrado } from '../AbrirTurno/turno-cerrado';

/** The screen's states: its data, or one of these. */
export type CierreEstado = 'happy' | 'loading' | 'error' | 'sin-turno';

export interface CierreEstadosProps {
  readonly id: Exclude<CierreEstado, 'happy'>;
  readonly onRetry: () => void;
  /** Sin turno: opens the fondo sheet over this screen. */
  readonly onAbrirTurno: () => void;
}

export function CierreEstados(p: CierreEstadosProps): ReactElement {
  if (p.id === 'loading') {
    return (
      <View flex={1} alignItems="center" justifyContent="center" testID="cierre-cargando">
        <Spinner />
      </View>
    );
  }
  if (p.id === 'error') {
    return (
      <ErrorState
        title="No pudimos calcular tu corte"
        body="Tus datos están a salvo en este dispositivo. Vuelve a intentar en un momento."
        retryLabel="Intentar de nuevo"
        onRetry={p.onRetry}
        testID="cierre-error"
      />
    );
  }
  return <TurnoCerrado pantalla="cierre" onAbrir={p.onAbrirTurno} testID="cierre-sin-turno" />;
}
