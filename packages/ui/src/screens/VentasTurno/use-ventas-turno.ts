/**
 * `useVentasTurno` — the open turno's tickets from the phone's own database,
 * as the web caja's `ventasDelTurno` reads them: the tickets of the turno
 * (newest first), each with its lines, its fiado client (and what they owe
 * now, from Cobrar's cached accounts) and who captured it.
 */
import { useQuery } from '@tanstack/react-query';
import type { CajaTurno, Ticket, UserId } from '@xangarro/domain';
import { hoyLocal } from '@xangarro/caja';
import {
  useClientsRepository,
  useSalesRepository,
  useTicketsRepository,
  useUsersRepository,
} from '../../app/index';
import { useCurrentBusinessId } from '../../app-config/index';
import { useOpenCajaTurno } from '../../hooks/use-open-caja-turno';
import { useClientesFiado } from '../Checkout/use-cobrar-datos';
import type { TicketLeido } from './ventas-lectura';

export const ventasTurnoKeys = {
  all: ['ventas-turno'] as const,
  turno: (turnoId: string | null) => ['ventas-turno', turnoId] as const,
};

export type EstadoVentas = 'loading' | 'error' | 'sin-turno' | 'empty' | 'happy';

export interface VentasTurno {
  readonly state: EstadoVentas;
  readonly tickets: readonly TicketLeido[];
  readonly turno: CajaTurno | null;
  readonly hoy: string;
  readonly refetch: () => void;
}

type Repos = {
  readonly sales: ReturnType<typeof useSalesRepository>;
  readonly clients: ReturnType<typeof useClientsRepository>;
  readonly users: ReturnType<typeof useUsersRepository>;
};

async function leer(t: Ticket, r: Repos, nombres: Map<string, string | null>) {
  const lineas = await r.sales.findByTicket(t.id);
  const cliente = t.clienteId === null ? null : await r.clients.findById(t.clienteId);
  const uid = t.createdByUserId ?? null;
  if (uid !== null && !nombres.has(uid)) {
    nombres.set(uid, (await r.users.findById(uid as UserId))?.nombre ?? null);
  }
  return {
    ticket: t,
    lineas,
    clienteId: cliente?.id ?? null,
    cliente: cliente === null ? null : { nombre: cliente.nombre },
    capturo: uid === null ? null : (nombres.get(uid) ?? null),
  };
}

export function useVentasTurno(): VentasTurno {
  const tickets = useTicketsRepository();
  const repos: Repos = {
    sales: useSalesRepository(),
    clients: useClientsRepository(),
    users: useUsersRepository(),
  };
  const businessId = useCurrentBusinessId();
  const { openTurno, isLoading } = useOpenCajaTurno();
  const turnoId = openTurno?.id ?? null;
  const cuentas = useClientesFiado().data ?? [];
  const q = useQuery({
    queryKey: ventasTurnoKeys.turno(turnoId),
    enabled: businessId !== null && turnoId !== null,
    queryFn: async () => {
      const rows = await tickets.findByCajaTurno(turnoId as never);
      const nombres = new Map<string, string | null>();
      const leidos = await Promise.all(rows.map((t) => leer(t, repos, nombres)));
      // A ticket whose every line the old phone flow deleted has nothing to show.
      return leidos.filter((t) => t.lineas.length > 0);
    },
  });
  const conSaldo: readonly TicketLeido[] = (q.data ?? []).map(({ clienteId, ...t }) => {
    const saldo = cuentas.find((c) => c.id === clienteId)?.saldo;
    return t.cliente === null || saldo === undefined
      ? t
      : { ...t, cliente: { ...t.cliente, saldo } };
  });
  return {
    state: estadoDe(isLoading, turnoId, q.isLoading, q.isError, conSaldo.length),
    tickets: conSaldo,
    turno: openTurno,
    hoy: hoyLocal(),
    refetch: () => void q.refetch(),
  };
}

function estadoDe(
  turnoCargando: boolean,
  turnoId: string | null,
  cargando: boolean,
  error: boolean,
  n: number,
): EstadoVentas {
  if (turnoCargando) return 'loading';
  if (turnoId === null) return 'sin-turno';
  if (error) return 'error';
  if (cargando) return 'loading';
  return n === 0 ? 'empty' : 'happy';
}
