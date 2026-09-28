/**
 * «Hoy no» on the phone: the «Para hoy» rows put off for the rest of today,
 * kept in this device's app config under the web's key and read with the
 * caja package's rule (`vigentes`: another day's list is stale). Shown
 * optimistically; the write follows.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { hoyLocal, vigentes } from '@xangarro/caja';
import { useRepositories } from '../../app/repository-provider';

const KEY = 'operador.hoyNo';

export interface HoyNo {
  readonly ocultos: readonly string[];
  readonly ocultar: (id: string) => void;
  /** «Ver todas»: bring back everything put off today. */
  readonly mostrarTodo: () => void;
}

export function useHoyNo(): HoyNo {
  const { appConfig } = useRepositories();
  const qc = useQueryClient();
  const hoy = hoyLocal();
  const key = ['hoy-no', hoy];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => vigentes(await appConfig.get(KEY), hoy),
  });
  const ocultos = q.data ?? [];
  const guardar = (ids: readonly string[]): void => {
    qc.setQueryData(key, ids);
    void appConfig.set(KEY, JSON.stringify({ fecha: hoy, ids })).catch(() => undefined);
  };
  return {
    ocultos,
    ocultar: (id) => guardar([...ocultos, id]),
    mostrarTodo: () => guardar([]),
  };
}
