/**
 * useAperturaTurno — the fondo sheet for whichever route needs it: `abrir`
 * shows it over the current screen and the route renders `hoja`, outside
 * anything the open turno replaces, so the sheet survives the refresh that
 * opening causes. `onAbierto` runs once the turno is open and the sheet shut.
 */
import { useState, type ReactElement } from 'react';
import { AbrirTurnoFlow } from './abrir-turno-flow';

export interface AperturaTurno {
  readonly abrir: () => void;
  readonly hoja: ReactElement;
}

export function useAperturaTurno(onAbierto?: () => void): AperturaTurno {
  const [abierta, setAbierta] = useState(false);
  return {
    abrir: () => setAbierta(true),
    hoja: <AbrirTurnoFlow open={abierta} onClose={() => setAbierta(false)} onAbierto={onAbierto} />,
  };
}
