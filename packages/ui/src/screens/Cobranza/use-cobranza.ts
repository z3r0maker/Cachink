/**
 * useCobranza — Fiado y abonos' data for the signed-in operator (M-08): the
 * business's credit accounts from the phone's own rows (`leerCuentas`), the
 * turno's date for «abonos de hoy», the business's name for the reminder and
 * the owner's for the limit note. The abono write goes through
 * `RegistrarPagoClienteUseCase`, the same use case the web's register uses
 * (O-33); the query key sits under the caja's family, so a venta fiada or an
 * abono refreshes everything.
 */
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RegistrarPagoClienteUseCase } from '@xangarro/application';
import { hoyLocal, nombreDueno } from '@xangarro/caja';
import type { CuentaCliente, MetodoAbono } from '@xangarro/caja/cobranza';
import { SYNC_CONFIG_KEYS } from '@xangarro/sync';
import type { BusinessId, Money } from '@xangarro/domain';
import {
  useAppConfigRepository,
  useClientPaymentsRepository,
  useClientsRepository,
  useSalesRepository,
  useTicketsRepository,
  useUsersRepository,
} from '../../app/index';
import { useCurrentBusinessId } from '../../app-config/index';
import { cajaKeys } from '../../hooks/query-keys';
import { useAuditedUseCase } from '../../observability/index';
import { AUDIT_REGISTRAR_PAGO } from '../../observability/audit-configs';
import { useShellData } from '../AppShell/use-shell-data';
import { leerCuentas } from './cobranza-lectura';

/** One abono the operator is recording, whole (an excess is saldo a favor, D5). */
export interface AbonoHecho {
  readonly clienteId: string;
  readonly metodo: MetodoAbono;
  readonly monto: Money;
}

/** What the screen and its sheets read: the accounts, the day and the names. */
export interface DatosCobranza {
  readonly cuentas: readonly CuentaCliente[];
  /** The turno's day (YYYY-MM-DD): its abonos are «los que recibiste hoy». */
  readonly hoy: string;
  /** Named in the WhatsApp reminder («Te escribimos de Taquería Don Pedro»). */
  readonly negocio: string;
  /** The limit note names them («El límite y el plazo los define Pedro»). */
  readonly dueno: string;
}

export interface CobranzaVivo {
  readonly state: 'cargando' | 'error' | 'happy';
  readonly data: DatosCobranza | null;
  /**
   * Records the abono and refreshes the accounts. Returns the error message
   * when it failed, or null when it landed — the toast says which.
   */
  readonly registrar: (a: AbonoHecho) => Promise<string | null>;
  readonly refetch: () => void;
}

export function cobranzaKey(businessId: BusinessId | null): readonly unknown[] {
  return [...cajaKeys.byBusiness(businessId), 'cobranza'];
}

function useCuentas(hoy: string, caja: string) {
  const repos = {
    clients: useClientsRepository(),
    tickets: useTicketsRepository(),
    sales: useSalesRepository(),
    clientPayments: useClientPaymentsRepository(),
    users: useUsersRepository(),
  };
  const businessId = useCurrentBusinessId();
  const q = useQuery({
    queryKey: [...cobranzaKey(businessId), hoy, caja],
    enabled: businessId !== null,
    queryFn: () => leerCuentas(repos, businessId as BusinessId, hoy, caja),
  });
  return { cuentas: q.data ?? null, isError: q.isError, refetch: q.refetch };
}

function useDueno(): string {
  const appConfig = useAppConfigRepository();
  const q = useQuery({
    queryKey: ['cobranza', 'dueno'],
    queryFn: () => appConfig.get(SYNC_CONFIG_KEYS.duenoNombre),
  });
  return nombreDueno(q.data ?? null);
}

/** The write: the same use case the web's register records an abono with. */
function useRegistrarAbono() {
  const payments = useClientPaymentsRepository();
  const clients = useClientsRepository();
  const businessId = useCurrentBusinessId();
  const queryClient = useQueryClient();
  const useCase = useAuditedUseCase(
    useMemo(() => new RegistrarPagoClienteUseCase(payments, clients), [payments, clients]),
    AUDIT_REGISTRAR_PAGO,
  );
  const m = useMutation({
    mutationFn: async (a: AbonoHecho) => {
      if (!businessId) throw new Error('No hay negocio en esta caja');
      await useCase.execute({
        clienteId: a.clienteId as never,
        fecha: hoyLocal() as never,
        montoCentavos: a.monto,
        metodo: a.metodo,
        businessId: businessId as BusinessId,
      });
    },
  });
  return async (a: AbonoHecho): Promise<string | null> => {
    try {
      await m.mutateAsync(a);
      await queryClient.invalidateQueries({ queryKey: cajaKeys.byBusiness(businessId) });
      return null;
    } catch (e) {
      return `No se pudo registrar el abono: ${e instanceof Error ? e.message : String(e)}`;
    }
  };
}

export function useCobranza(): CobranzaVivo {
  const hoy = hoyLocal();
  const shell = useShellData();
  const negocio = shell.negocio ?? '';
  const { cuentas, isError, refetch } = useCuentas(hoy, shell.caja ?? 'la caja');
  const registrar = useRegistrarAbono();
  const dueno = useDueno();
  return {
    state: isError ? 'error' : cuentas === null ? 'cargando' : 'happy',
    data: cuentas === null ? null : { cuentas, hoy, negocio, dueno },
    registrar,
    refetch: () => void refetch(),
  };
}
