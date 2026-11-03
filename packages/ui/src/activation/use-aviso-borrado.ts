/**
 * useAvisoBorrado — whether this launch follows a «Desvincular y borrar»
 * (MvDesvincularBorrar «Listo»). The flag `wipeDevice` leaves is read once
 * and deleted at once, so the notice shows on this visit to the connect
 * screen and never again.
 */

import { useEffect, useState } from 'react';
import { APP_CONFIG_KEYS } from '../app-config/types';
import { useAppConfigRepository } from '../app/repository-provider';

export function useAvisoBorrado(): boolean {
  const appConfig = useAppConfigRepository();
  const [borrado, setBorrado] = useState(false);
  useEffect(() => {
    let vivo = true;
    void (async () => {
      const marca = await appConfig.get(APP_CONFIG_KEYS.avisoBorrado);
      if (marca === null) return;
      await appConfig.delete(APP_CONFIG_KEYS.avisoBorrado);
      if (vivo) setBorrado(true);
    })().catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [appConfig]);
  return borrado;
}
