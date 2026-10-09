/**
 * The states Ventas shows besides its data (MvVentas; the board's Operador
 * Estado): cargando, sin ventas en este turno, sin turno abierto, and the
 * failed read. Each says what to do next.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Btn, ErrorState, Spinner } from '../../components/index';
import { EmptyState } from '../../components/EmptyState/index';

/** The screen's states: its data, or one of these (the web's EstadoMode plus sin-turno). */
export type VentasEstado = 'happy' | 'loading' | 'empty' | 'error' | 'sin-turno';

export interface VentasEstadosProps {
  readonly id: Exclude<VentasEstado, 'happy'>;
  readonly onRetry: () => void;
  /** The empty and sin-turno way forward. */
  readonly onIrACobrar: () => void;
}

export function VentasEstados(p: VentasEstadosProps): ReactElement {
  if (p.id === 'loading') {
    return (
      <View flex={1} alignItems="center" justifyContent="center" testID="ventas-cargando">
        <Spinner />
      </View>
    );
  }
  if (p.id === 'error') {
    return (
      <ErrorState
        title="No pudimos cargar tus ventas"
        body="Tus datos están a salvo en este dispositivo. Vuelve a intentar en un momento."
        retryLabel="Intentar de nuevo"
        onRetry={p.onRetry}
        testID="ventas-error"
      />
    );
  }
  return <SinDatos id={p.id} onIrACobrar={p.onIrACobrar} />;
}

function SinDatos(p: {
  readonly id: 'empty' | 'sin-turno';
  readonly onIrACobrar: () => void;
}): ReactElement {
  const sinTurno = p.id === 'sin-turno';
  return (
    <EmptyState
      icon={sinTurno ? 'banknote' : 'receipt'}
      title={sinTurno ? 'Sin turno abierto' : 'Sin ventas en este turno'}
      description={
        sinTurno
          ? 'Las ventas de cada turno aparecen aquí. Abre tu turno en Inicio y lo que cobres se va sumando.'
          : 'Cuando cobres la primera, aparece aquí con su folio, su método y la opción de cancelar.'
      }
      action={
        <Btn variant="primary" onPress={p.onIrACobrar} testID="ventas-ir-cobrar">
          Ir a cobrar
        </Btn>
      }
      testID={sinTurno ? 'ventas-sin-turno' : 'ventas-vacio'}
    />
  );
}
