/**
 * The header bell's count (MvAvisos: «Avisos de Pedro, 2 sin leer»): the
 * owner's messages this operator hasn't read or answered. Light on purpose,
 * it runs under every screen: the messages and the read marks only, keyed
 * under `avisos` so a mark or a reply recounts it, and a pull that brings a
 * new message refreshes it with everything else.
 */
import { useQuery } from '@tanstack/react-query';
import { hoyLocal } from '@xangarro/caja';
import { avisosVivos } from '@xangarro/caja/avisos';
import type { BusinessId, UserId } from '@xangarro/domain';
import { useRepositories } from '../../app/repository-provider';
import { useCurrentBusinessId, useUserId } from '../../app-config/use-app-config';
import { leerMensajes, leidos } from './avisos-lectura';
import { avisosKey } from './use-avisos-caja';

export function useAvisosSinLeer(): number {
  const repos = useRepositories();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const userId = useUserId() as UserId | null;
  const q = useQuery({
    queryKey: [...avisosKey(businessId, userId), 'sin-leer'],
    enabled: businessId !== null && userId !== null,
    queryFn: async () => {
      const [mensajes, marcas] = await Promise.all([
        leerMensajes(repos, businessId as BusinessId, userId as UserId),
        leidos(repos),
      ]);
      const a = {
        mensajes,
        leidos: marcas,
        cola: { cuantos: 0, desde: null },
        rechazados: 0,
        stockBajo: [],
        dueno: null,
      };
      return avisosVivos(a, hoyLocal()).avisos.filter((x) => !x.leido).length;
    },
  });
  return q.data ?? 0;
}
