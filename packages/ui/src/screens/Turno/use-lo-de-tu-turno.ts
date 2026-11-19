/**
 * «Lo de tu turno»'s live lines and chips (MvTurno): the turno's own read,
 * Inventario's stock, the avisos the header bell counts (the same query, so
 * the chip and the bell agree) and the queue, said by `filasDelTurno`
 * (`@xangarro/caja/turno`). A side read still out leaves its row's own line.
 */
import { filasDelTurno, type FilasTurno, type TurnoData } from '@xangarro/caja/turno';
import { useAvisos } from '../Avisos/use-avisos';
import { useExistencias } from '../Inventario/use-inventario';

export function useLoDeTuTurno(data: TurnoData | null, porEnviar: number): FilasTurno {
  const existencias = useExistencias();
  const a = useAvisos();
  const avisos = a.state === 'error' ? undefined : a.data?.avisos;
  return filasDelTurno(data, {
    ...(existencias === undefined ? {} : { existencias }),
    ...(avisos === undefined ? {} : { avisos }),
    porEnviar,
  });
}
