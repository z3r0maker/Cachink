/**
 * useVentasTurno — Ventas del turno's data for the signed-in operator (M-08):
 * the open turno's tickets as `VentasData` (the session around them), the
 * ticket a folio opens, and the cancel itself through `CancelarTicketUseCase`
 * (permission + PIN + stock back + the audit log, ADR-073). Keyed under the
 * caja's queries, so a sale captured on Cobrar refreshes this list too.
 */
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { hoyLocal } from '@xangarro/caja';
import { CancelarTicketUseCase } from '@xangarro/application';
import { SYNC_CONFIG_KEYS } from '@xangarro/sync';
import type { BusinessId, TicketId, UserId } from '@xangarro/domain';
import type { CargaTicket, VentasData, VentaTurno } from '@xangarro/caja/ventas';
import { useRepositories } from '../../app/repository-provider';
import { useCurrentBusinessId, useUserId } from '../../app-config/use-app-config';
import { cajaKeys } from '../../hooks/query-keys';
import { useShellData } from '../AppShell/use-shell-data';
import { leerVentaDetalle, leerVentasTurno, type FilasVentas } from './ventas-lectura';
import type { VentasEstado } from './ventas-mostrador-screen';

export interface VentasTurnoVivo {
  readonly state: VentasEstado;
  readonly data: VentasData | null;
  /** The owner's name (the amber note says it); null until the last pull. */
  readonly dueno: string | null;
  readonly refetch: () => void;
  readonly cargarDetalle: (folio: string, fila: VentaTurno | undefined) => Promise<CargaTicket>;
  /** Resolves the error to show, or null once the ticket stands cancelled. */
  readonly cancelar: (venta: VentaTurno, motivo: string, pin: string) => Promise<string | null>;
}

export function ventasTurnoKey(
  businessId: BusinessId | null,
  userId: UserId | null,
): readonly unknown[] {
  return [...cajaKeys.byBusiness(businessId), 'ventas-turno', userId];
}

function useDueno(): string | null {
  const { appConfig } = useRepositories();
  const q = useQuery({
    queryKey: ['ventas-turno', 'dueno'],
    queryFn: () => appConfig.get(SYNC_CONFIG_KEYS.duenoNombre),
  });
  return q.data ?? null;
}

/** The rows with the session around them, as the screen's `VentasData`. */
function comoData(
  f: { readonly desde: string | null; readonly ventas: readonly VentaTurno[] },
  shell: ReturnType<typeof useShellData>,
): VentasData {
  return {
    negocio: shell.negocio ?? 'Tu negocio',
    operador: shell.operador?.nombre ?? '',
    caja: shell.caja ?? 'Caja',
    desde: f.desde ?? '',
    ventas: f.ventas,
  };
}

/** The ticket a folio opens, read live from the register's tables. */
function useCargarDetalle(
  repos: Parameters<typeof leerVentaDetalle>[0],
  operador: ReturnType<typeof useShellData>['operador'],
  hoy: string,
) {
  return useCallback(
    (_folio: string, fila: VentaTurno | undefined): Promise<CargaTicket> => {
      if (fila?.id === undefined || operador === null) {
        return Promise.resolve({ state: 'empty' });
      }
      return leerVentaDetalle(repos, fila.id as TicketId, {
        hoy,
        capturo: operador.nombre,
      }).then((venta) => (venta === null ? { state: 'empty' } : { state: 'happy', venta }));
    },
    [repos, operador, hoy],
  );
}

/** Cancels through `CancelarTicketUseCase`, then sweeps the caja's queries. */
function useCancelarTicket(
  repos: ReturnType<typeof useRepositories>,
  businessId: BusinessId | null,
  userId: string | null,
) {
  const queryClient = useQueryClient();
  return useCallback(
    async (venta: VentaTurno, motivo: string, pin: string): Promise<string | null> => {
      if (venta.id === undefined) return 'Esta venta no se puede cancelar desde aquí.';
      const uc = new CancelarTicketUseCase(
        repos.tickets,
        repos.sales,
        repos.users,
        repos.products,
        repos.inventoryMovements,
        repos.cancelacionLogs,
      );
      try {
        await uc.execute({
          ticketId: venta.id as TicketId,
          userId: userId as UserId,
          pin,
          motivo,
          businessId: businessId as BusinessId,
        });
      } catch (e: unknown) {
        return `No se pudo cancelar: ${e instanceof Error ? e.message : String(e)}`;
      }
      await queryClient.invalidateQueries({ queryKey: cajaKeys.byBusiness(businessId) });
      return null;
    },
    [repos, userId, businessId, queryClient],
  );
}

/** The screen's state from the query's: sin-turno and sin-ventas said apart. */
function estadoVentas(
  q: { readonly isError: boolean; readonly data?: FilasVentas },
  operador: ReturnType<typeof useShellData>['operador'],
): VentasEstado {
  if (q.isError) return 'error';
  const f = q.data;
  if (f === undefined || operador === null) return 'loading';
  if (f.turnoId === null) return 'sin-turno';
  return f.ventas.length === 0 ? 'empty' : 'happy';
}

export function useVentasTurno(): VentasTurnoVivo {
  const repos = useRepositories();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const userId = useUserId();
  const shell = useShellData();
  const dueno = useDueno();
  const hoy = hoyLocal();
  const q = useQuery({
    queryKey: [...ventasTurnoKey(businessId, userId), hoy],
    queryFn: () => leerVentasTurno(repos, userId as UserId),
    enabled: businessId !== null && userId !== null,
  });
  const data =
    q.data && q.data.turnoId !== null && shell.operador !== null ? comoData(q.data, shell) : null;
  const cargarDetalle = useCargarDetalle(repos, shell.operador, hoy);
  const cancelar = useCancelarTicket(repos, businessId, userId);
  const recargar = useCallback(() => void q.refetch(), [q]);
  return {
    state: estadoVentas(q, shell.operador),
    data,
    dueno,
    refetch: recargar,
    cargarDetalle,
    cancelar,
  };
}
