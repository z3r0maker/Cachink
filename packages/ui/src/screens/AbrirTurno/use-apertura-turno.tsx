/**
 * useAperturaTurno — the fondo sheet for whichever route needs it: `abrir`
 * shows it over the current screen and the route renders `hoja`, outside
 * anything the open turno replaces, so the sheet survives the refresh that
 * opening causes. `onAbierto` runs once the turno is open and the sheet shut.
 * `abrirOtro` is the same sheet right after a close (ADR-146): «¿Con cuánto
 * sigues?», the counted cash suggested.
 */
import { useState, type ReactElement } from 'react';
import { AbrirTurnoFlow } from './abrir-turno-flow';

export interface AperturaTurno {
  readonly abrir: () => void;
  readonly abrirOtro: () => void;
  readonly hoja: ReactElement;
}

export function useAperturaTurno(onAbierto?: () => void): AperturaTurno {
  const [abierta, setAbierta] = useState<'no' | 'nuevo' | 'otro'>('no');
  return {
    abrir: () => setAbierta('nuevo'),
    abrirOtro: () => setAbierta('otro'),
    hoja: (
      <AbrirTurnoFlow
        open={abierta !== 'no'}
        otro={abierta === 'otro'}
        onClose={() => setAbierta('no')}
        onAbierto={onAbierto}
      />
    ),
  };
}
