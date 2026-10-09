/**
 * What the cobro reads besides the ticket: the folio the next sale takes
 * («V-0413», the device's own counter) and the fiado clients with what each
 * owes, derived the domain's way (`estadoDeCuenta` over the fiado tickets and
 * the abonos), as the web caja's runtime `cuentas.ts` does.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { estadoDeCuenta, type BusinessId, type ClientId, type Money } from '@xangarro/domain';
import type { ClienteFiado } from '@xangarro/caja/caja';
import {
  useClientPaymentsRepository,
  useClientsRepository,
  useSalesRepository,
  useTicketsRepository,
} from '../../app/index';
import { useCurrentBusinessId } from '../../app-config/index';
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

type Repos = {
  readonly tickets: ReturnType<typeof useTicketsRepository>;
  readonly sales: ReturnType<typeof useSalesRepository>;
  readonly payments: ReturnType<typeof useClientPaymentsRepository>;
};

async function saldoDe(id: ClientId, r: Repos): Promise<Money> {
  const ventas = await r.tickets.findCreditoByClient(id);
  const abonos = await r.payments.findByCliente(id);
  const cargos = await Promise.all(
    ventas.map(async (t) => {
      const lineas = await r.sales.findByTicket(t.id);
      return { id: t.id, fecha: t.fecha, monto: lineas.reduce((a, l) => a + l.monto, 0n) };
    }),
  );
  const abonosVivos = abonos.map((a) => ({ id: a.id, fecha: a.fecha, monto: a.montoCentavos }));
  return estadoDeCuenta(cargos, abonosVivos).saldo;
}

export function useClientesFiado(): UseQueryResult<readonly ClienteFiado[], Error> {
  const clients = useClientsRepository();
  const repos: Repos = {
    tickets: useTicketsRepository(),
    sales: useSalesRepository(),
    payments: useClientPaymentsRepository(),
  };
  const businessId = useCurrentBusinessId();
  return useQuery({
    queryKey: cobrarKeys.clientes(businessId),
    enabled: businessId !== null,
    queryFn: async () => {
      const rows = await clients.findByName('', businessId as BusinessId);
      const cuentas = await Promise.all(
        rows.map(async (c) => ({
          id: c.id as string,
          nombre: c.nombre,
          telefono: c.telefono ?? '',
          saldo: await saldoDe(c.id, repos),
        })),
      );
      return [...cuentas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-MX'));
    },
  });
}
