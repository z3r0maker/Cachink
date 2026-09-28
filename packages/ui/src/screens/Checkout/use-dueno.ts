/**
 * The owner's first name as the caja says it («Pedro lo revisa»), from what
 * the last pull stored; «el dueño» while the caja does not know it. Shares
 * Acceso's cache entry.
 */
import { useQuery } from '@tanstack/react-query';
import { nombreDueno } from '@xangarro/caja';
import { SYNC_CONFIG_KEYS } from '@xangarro/sync';
import { useAppConfigRepository } from '../../app/index';
import { useCurrentBusinessId } from '../../app-config/index';

export function useDueno(): string {
  const appConfig = useAppConfigRepository();
  const businessId = useCurrentBusinessId();
  const q = useQuery({
    queryKey: ['acceso', 'dueno', businessId],
    queryFn: () => appConfig.get(SYNC_CONFIG_KEYS.duenoNombre),
  });
  return nombreDueno(q.data ?? null);
}
