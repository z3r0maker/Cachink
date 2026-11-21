/**
 * useCobranza — Fiado y abonos' data for the signed-in operator (M-08): the
 * business's credit accounts from the phone's own rows (`leerCuentas`), the
 * turno's date for «abonos de hoy» and the business's name for the reminder.
 * The abono write is `useRegistrarAbono`'s:
 * the web register's use case (O-33), stamped with the open turno; the query
 * key sits under the caja's family, so a venta fiada or an abono refreshes
 * everything.
 */
import { useQuery } from '@tanstack/react-query';
import { hoyLocal } from '@xangarro/caja';
import type { CuentaCliente, MetodoAbono } from '@xangarro/caja/cobranza';
import type { BusinessId, Money } from '@xangarro/domain';
import {
  useClientPaymentsRepository,
  useClientsRepository,
  useSalesRepository,
  useTicketsRepository,
  useUsersRepository,
} from '../../app/index';
import { useCurrentBusinessId } from '../../app-config/index';
import { cajaKeys } from '../../hooks/query-keys';
import { useShellData } from '../AppShell/use-shell-data';
import { leerCuentas } from './cobranza-lectura';
import { useRegistrarAbono } from './use-registrar-abono';

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

/**
 * The write: the abono recorded through `RegistrarPagoClienteUseCase` and
 * stamped with the caja's open turno (ADR-146), so the turno's expected cash
 * counts it. The message when it failed, or null when it landed.
 */
function useRegistrar(): (a: AbonoHecho) => Promise<string | null> {
  const m = useRegistrarAbono();
  return async (a) => {
    try {
      await m.mutateAsync(a);
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
  const registrar = useRegistrar();
  return {
    state: isError ? 'error' : cuentas === null ? 'cargando' : 'happy',
    data: cuentas === null ? null : { cuentas, hoy, negocio },
    registrar,
    refetch: () => void refetch(),
  };
}
