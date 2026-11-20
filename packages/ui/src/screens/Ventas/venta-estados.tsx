/**
 * The states Ventas shows besides its data (MvVentas, MvEstados and
 * MvTurnoCerrado): cargando, sin ventas en este turno, sin turno abierto, and
 * the failed read. Each says what to do next.
 */
import type { ReactElement } from 'react';
import { CajaEstado, EstadoCargando, EstadoVacio } from '../../components/index';
import { TurnoCerrado } from '../AbrirTurno/turno-cerrado';

/** The screen's states: its data, or one of these (the web's EstadoMode plus sin-turno). */
export type VentasEstado = 'happy' | 'loading' | 'empty' | 'error' | 'sin-turno';

export interface VentasEstadosProps {
  readonly id: Exclude<VentasEstado, 'happy'>;
  readonly onRetry: () => void;
  /** The empty state's way forward. */
  readonly onIrACobrar: () => void;
  /** Sin turno: opens the fondo sheet over this screen. */
  readonly onAbrirTurno: () => void;
}

export function VentasEstados(p: VentasEstadosProps): ReactElement {
  if (p.id === 'loading') return <EstadoCargando testID="ventas-cargando" />;
  if (p.id === 'error') {
    return (
      <CajaEstado
        mode="error"
        errorTitle="No pudimos cargar tus ventas"
        onRetry={p.onRetry}
        testID="ventas"
      />
    );
  }
  if (p.id === 'sin-turno') {
    return <TurnoCerrado pantalla="ventas" onAbrir={p.onAbrirTurno} testID="ventas-sin-turno" />;
  }
  return (
    <EstadoVacio
      id="ventas-vacio"
      encabezado="Ventas"
      title="Todavía no hay ventas en este turno"
      body="En cuanto cobres algo, aparece en esta lista."
      cta={{ label: 'Cobrar la primera', onPress: p.onIrACobrar }}
    />
  );
}
