/**
 * useAvisoBorrado — whether this phone was wiped by «Desvincular y borrar»
 * and not linked since (MvDesvincularBorrar «Listo»). The flag `wipeDevice`
 * leaves is only read here; linking again deletes it (`persistActivation`).
 * Deleting it on read lost the notice: the connect screen mounts before the
 * restart and again after it.
 */

import { useEffect, useState } from 'react';
import { APP_CONFIG_KEYS } from '../app-config/types';
import { useAppConfigRepository } from '../app/repository-provider';

export function useAvisoBorrado(): boolean {
  const appConfig = useAppConfigRepository();
  const [borrado, setBorrado] = useState(false);
  useEffect(() => {
    let vivo = true;
    appConfig
      .get(APP_CONFIG_KEYS.avisoBorrado)
      .then((marca) => {
        if (vivo) setBorrado(marca !== null);
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [appConfig]);
  return borrado;
}
