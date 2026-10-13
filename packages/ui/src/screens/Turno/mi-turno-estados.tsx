/**
 * The states Mi turno shows besides its data (Track M, M-09; the board's
 * Operador Estado plus the phone's sin-turno): cargando, sin turno abierto,
 * turno en blanco and the failed read. Each says what to do next.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Btn, ErrorState, Spinner } from '../../components/index';
import { EmptyState } from '../../components/EmptyState/index';

/** The screen's states: its data, or one of these. */
export type MiTurnoEstado = 'happy' | 'loading' | 'empty' | 'error' | 'sin-turno';

export interface MiTurnoEstadosProps {
  readonly id: Exclude<MiTurnoEstado, 'happy'>;
  readonly onRetry: () => void;
  /** The sin-turno and empty way forward. */
  readonly onIrAInicio: () => void;
}

function SinTurno(p: { readonly onIrAInicio: () => void }): ReactElement {
  return (
    <EmptyState
      icon="banknote"
      title="Sin turno abierto"
      description="Abre tu turno desde Inicio y aquí verás el efectivo que debe haber en la caja, tus ventas y tus gastos."
      action={
        <Btn variant="primary" onPress={p.onIrAInicio} testID="turno-ir-inicio">
          Ir a Inicio
        </Btn>
      }
      testID="turno-sin-turno"
    />
  );
}

function EnBlanco(p: { readonly onIrAInicio: () => void }): ReactElement {
  return (
    <EmptyState
      icon="receipt"
      title="Tu turno va en blanco"
      description="Todavía no has capturado nada. En cuanto cobres la primera venta, aparece aquí."
      action={
        <Btn variant="primary" onPress={p.onIrAInicio} testID="turno-ir-cobrar">
          Ir a cobrar
        </Btn>
      }
      testID="turno-vacio"
    />
  );
}

export function MiTurnoEstados(p: MiTurnoEstadosProps): ReactElement {
  if (p.id === 'loading') {
    return (
      <View flex={1} alignItems="center" justifyContent="center" testID="turno-cargando">
        <Spinner />
      </View>
    );
  }
  if (p.id === 'error') {
    return (
      <ErrorState
        title="No pudimos cargar tu turno"
        body="Tus datos están a salvo en este dispositivo. Vuelve a intentar en un momento."
        retryLabel="Intentar de nuevo"
        onRetry={p.onRetry}
        testID="turno-error"
      />
    );
  }
  return p.id === 'sin-turno' ? (
    <SinTurno onIrAInicio={p.onIrAInicio} />
  ) : (
    <EnBlanco onIrAInicio={p.onIrAInicio} />
  );
}
