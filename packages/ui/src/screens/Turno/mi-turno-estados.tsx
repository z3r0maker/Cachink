/**
 * The states Mi turno shows besides its data (Track M, M-09; the board's
 * Operador Estado plus the phone's sin-turno): cargando, sin turno abierto,
 * turno en blanco and the failed read. Each says what to do next.
 */
import type { ReactElement } from 'react';
import { CajaEstado, EstadoCargando, EstadoVacio } from '../../components/index';
import { TurnoCerrado } from '../AbrirTurno/turno-cerrado';

/** The screen's states: its data, or one of these. */
export type MiTurnoEstado = 'happy' | 'loading' | 'empty' | 'error' | 'sin-turno';

export interface MiTurnoEstadosProps {
  readonly id: Exclude<MiTurnoEstado, 'happy'>;
  readonly onRetry: () => void;
  /** The empty state's way forward. */
  readonly onIrAInicio: () => void;
  /** Sin turno: opens the fondo sheet over this screen. */
  readonly onAbrirTurno: () => void;
}

function EnBlanco(p: { readonly onIrAInicio: () => void }): ReactElement {
  return (
    <EstadoVacio
      id="turno-vacio"
      title="Tu turno va en blanco"
      body="Todavía no has capturado nada. En cuanto cobres la primera venta, aparece aquí."
      cta={{ label: 'Ir a cobrar', onPress: p.onIrAInicio }}
    />
  );
}

export function MiTurnoEstados(p: MiTurnoEstadosProps): ReactElement {
  if (p.id === 'loading') return <EstadoCargando testID="turno-cargando" />;
  if (p.id === 'error') {
    return (
      <CajaEstado
        mode="error"
        errorTitle="No pudimos cargar tu turno"
        onRetry={p.onRetry}
        testID="turno"
      />
    );
  }
  return p.id === 'sin-turno' ? (
    <TurnoCerrado pantalla="turno" onAbrir={p.onAbrirTurno} testID="turno-sin-turno" />
  ) : (
    <EnBlanco onIrAInicio={p.onIrAInicio} />
  );
}
