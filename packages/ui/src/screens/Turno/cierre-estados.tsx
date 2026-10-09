/**
 * The states Cierre shows besides its count (Track M, M-09): cargando, sin
 * turno abierto (nothing to close) and the failed read. Each says what to
 * do next.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Btn, ErrorState, Spinner } from '../../components/index';
import { EmptyState } from '../../components/EmptyState/index';

/** The screen's states: its data, or one of these. */
export type CierreEstado = 'happy' | 'loading' | 'error' | 'sin-turno';

export interface CierreEstadosProps {
  readonly id: Exclude<CierreEstado, 'happy'>;
  readonly onRetry: () => void;
  /** The sin-turno way forward. */
  readonly onIrAInicio: () => void;
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
  return (
    <EmptyState
      icon="banknote"
      title="No hay nada que cerrar"
      description="Este turno no tiene movimientos. Abre tu turno desde Inicio para volver a capturar."
      action={
        <Btn variant="primary" onPress={p.onIrAInicio} testID="cierre-ir-inicio">
          Ir a Inicio
        </Btn>
      }
      testID="cierre-sin-turno"
    />
  );
}
