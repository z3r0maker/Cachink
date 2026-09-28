/**
 * What the cobro reads besides the ticket: the folio the next sale takes
 * («V-0413», the device's own counter) and the fiado clients with what each
 * owes, from the same accounts read as Fiado y abonos (`leerCuentas`, over
 * `@xangarro/caja`'s `cuentaPara`, the web Worker's own assembly).
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { BusinessId, Money } from '@xangarro/domain';
import type { ClienteFiado } from '@xangarro/caja/caja';
import { useTicketsRepository } from '../../app/index';
import { useRepositories } from '../../app/repository-provider';
import { useCurrentBusinessId } from '../../app-config/index';
import { leerCuentas } from '../Cobranza/cuentas-lectura';
import { folioTexto } from './cobro-logic';

export const cobrarKeys = {
  folio: (b: BusinessId | null) => ['cobrar', 'folio', b] as const,
  clientes: (b: BusinessId | null) => ['cobrar', 'clientes', b] as const,
};

export function useSiguienteFolio(): string | null {
  const tickets = useTicketsRepository();
  const businessId = useCurrentBusinessId();
  const q = useQuery({
    queryKey: cobrarKeys.folio(businessId),
    enabled: businessId !== null,
    queryFn: async () => folioTexto(await tickets.nextFolio(businessId as BusinessId)),
  });
  return q.data ?? null;
}

export function useClientesFiado(): UseQueryResult<readonly ClienteFiado[], Error> {
  const repos = useRepositories();
  const businessId = useCurrentBusinessId();
  return useQuery({
    queryKey: cobrarKeys.clientes(businessId),
    enabled: businessId !== null,
    queryFn: async () => {
      const cuentas = (await leerCuentas(repos, businessId as BusinessId)).map((c) => ({
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono ?? '',
        saldo: BigInt(c.saldoCentavos) as Money,
      }));
      return [...cuentas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-MX'));
    },
  });
}
