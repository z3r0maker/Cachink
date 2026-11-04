/**
 * The unlink sheet's state (MvDesvincularBorrar): which card is chosen, how
 * many rows a wipe would destroy, and the two endings — `forgetDevice` keeps
 * the data, `wipeDevice` empties the phone and restarts the app.
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActivationContext } from '../../activation/activation-context';
import { forgetDevice } from '../../activation/forget-device';
import { sinEnviar, wipeDevice } from '../../activation/wipe-device';
import { useCloudSync } from '../../app/cloud-sync-bridge';
import { useAppConfigRepository } from '../../app/repository-provider';
import { useDatabase } from '../../database/index';

export type OpcionDesvincular = 'solo' | 'borrar';

export interface Desvincular {
  readonly opcion: OpcionDesvincular;
  readonly elegir: (o: OpcionDesvincular) => void;
  /** Rows a wipe would destroy: the pill's counts, or the last refusal's. */
  readonly pendientes: number;
  /** Some of them were refused: «Enviar ahora» cannot help, «No enviados» can. */
  readonly rechazados: boolean;
  readonly enviando: boolean;
  readonly enviar: () => void;
  readonly borrando: boolean;
  readonly fallo: boolean;
  readonly confirmar: () => void;
}

/** The wipe and its three outcomes: done, refused for unsent rows, failed. */
function useBorrar(p: {
  readonly onDone: () => void;
  readonly reiniciar?: () => void;
  readonly setBloqueo: (n: number) => void;
}) {
  const [borrando, setBorrando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const sync = useCloudSync();
  const db = useDatabase();
  const deps = useForgetDeps();
  const borrar = async (): Promise<void> => {
    setBorrando(true);
    setFallo(false);
    try {
      const r = await wipeDevice({ ...deps, db, contar: sync.contar, reiniciar: p.reiniciar });
      if (r.kind === 'pendiente') p.setBloqueo(r.sinEnviar);
      else p.onDone();
    } catch {
      setFallo(true);
    } finally {
      setBorrando(false);
    }
  };
  return { borrando, fallo, setFallo, borrar };
}

function useForgetDeps() {
  const appConfig = useAppConfigRepository();
  const { config } = useActivationContext();
  const queryClient = useQueryClient();
  return { appConfig, tokenStore: config.tokenStore, queryClient };
}

export function useDesvincular(props: {
  readonly onDone: () => void;
  readonly reiniciar?: () => void;
}): Desvincular {
  const [opcion, setOpcion] = useState<OpcionDesvincular>('solo');
  const [bloqueo, setBloqueo] = useState(0);
  const sync = useCloudSync();
  const deps = useForgetDeps();
  const b = useBorrar({ ...props, setBloqueo });
  return {
    opcion,
    elegir: (o) => {
      setOpcion(o);
      b.setFallo(false);
    },
    pendientes: Math.max(sinEnviar(sync.state.counts), bloqueo),
    rechazados: sync.state.counts.rejected > 0,
    enviando: sync.state.phase === 'syncing',
    enviar: () => {
      setBloqueo(0);
      sync.syncNow();
    },
    borrando: b.borrando,
    fallo: b.fallo,
    confirmar: () => {
      if (opcion === 'borrar') return void b.borrar();
      props.onDone();
      void forgetDevice(deps);
    },
  };
}
