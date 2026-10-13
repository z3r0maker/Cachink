/**
 * `useGastos` — Gastos' data (Track M, M-08): the turno's expenses and the
 * due recurring gastos, keyed under the caja's queries so a venta, a gasto
 * or a turno refreshes them, with the session's names around them.
 *
 * Registering goes through the phone's own write path, the one Egresos
 * uses: `RegistrarEgresoUseCase` for a plain gasto and, when the sheet was
 * opened on a due recurring gasto, `ProcesarGastoRecurrenteUseCase` — one
 * write that records the egreso and advances the schedule.
 */
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriaDominio, hhmmLocal, hoyLocal } from '@xangarro/caja';
import type { GastosData, NuevoGasto, RecurrentePorPagar } from '@xangarro/caja/gastos';
import type { BusinessId, CajaTurnoId, RecurringExpenseId, UserId } from '@xangarro/domain';
import { useRepositories } from '../../app/repository-provider';
import { useCurrentBusinessId, useUserId } from '../../app-config/use-app-config';
import { useProcesarGastoRecurrente } from '../../hooks/use-procesar-gasto-recurrente';
import { useRegistrarEgreso } from '../../hooks/use-registrar-egreso';
import { cajaKeys } from '../../hooks/query-keys';
import { useTranslation } from '../../i18n/index';
import { useShellData } from '../AppShell/use-shell-data';
import type { FilasGastos } from './gastos-lectura';
import { leerFilasGastos } from './gastos-lectura';

export interface GastosVivo {
  readonly state: 'loading' | 'error' | 'happy';
  readonly data: GastosData | null;
  /** The due recurrent gastos to pay; null until the read lands. */
  readonly porPagar: readonly RecurrentePorPagar[] | null;
  readonly registrar: (n: NuevoGasto) => Promise<void>;
  readonly refetch: () => void;
}

export function gastosKey(
  businessId: BusinessId | null,
  userId: UserId | null,
): readonly unknown[] {
  return [...cajaKeys.byBusiness(businessId), 'gastos', userId];
}

/** What a plain gasto writes: the operator's words said the domain's way. */
function nuevoEgreso(n: NuevoGasto, businessId: BusinessId, turnoId: CajaTurnoId | null) {
  return {
    fecha: hoyLocal() as never,
    concepto: n.concepto,
    categoria: categoriaDominio(n.categoria),
    monto: n.monto,
    ...(n.proveedor === null ? {} : { proveedor: n.proveedor }),
    ...(turnoId === null ? {} : { cajaTurnoId: turnoId }),
    businessId,
  };
}

/** The write behind both sheets: a plain egreso, or one that pays a template. */
function useRegistrarGasto(
  businessId: BusinessId | null,
  filas: FilasGastos | undefined,
): (n: NuevoGasto) => Promise<void> {
  const repos = useRepositories();
  const egreso = useRegistrarEgreso();
  const procesar = useProcesarGastoRecurrente();
  const queryClient = useQueryClient();
  return useCallback(
    async (n: NuevoGasto): Promise<void> => {
      if (businessId === null || filas === undefined)
        throw new Error('No hay negocio en esta caja');
      const turnoId = filas.abierto?.id ?? null;
      if (n.recurrenteId === undefined) {
        await egreso.mutateAsync(nuevoEgreso(n, businessId, turnoId));
      } else {
        const template = await repos.recurringExpenses.findById(
          n.recurrenteId as RecurringExpenseId,
        );
        if (template === null) throw new Error('Ese gasto recurrente ya no existe');
        await procesar.mutateAsync({
          template,
          today: hoyLocal() as never,
          captura: {
            concepto: n.concepto,
            categoria: categoriaDominio(n.categoria),
            monto: n.monto,
            proveedor: n.proveedor,
            ...(turnoId === null ? {} : { cajaTurnoId: turnoId }),
          },
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cajaKeys.byBusiness(businessId) }),
        queryClient.invalidateQueries({ queryKey: cajaKeys.openByUser(businessId) }),
      ]);
    },
    [businessId, filas, egreso, procesar, queryClient, repos],
  );
}

export function useGastos(): GastosVivo {
  const { t } = useTranslation();
  const repos = useRepositories();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const userId = useUserId();
  const shell = useShellData();
  const hoy = hoyLocal();
  const q = useQuery({
    queryKey: [...gastosKey(businessId, userId), hoy],
    queryFn: () => leerFilasGastos(repos, businessId as BusinessId, userId as UserId, hoy),
    enabled: businessId !== null && userId !== null,
  });
  const registrar = useRegistrarGasto(businessId, q.data);
  const data =
    q.data && shell.operador
      ? {
          operador: shell.operador.nombre,
          caja: shell.caja ?? t('shell.cajaSinNombre'),
          desde: q.data.turno === null ? '' : hhmmLocal(q.data.turno.aperturaAt),
          gastos: q.data.gastos,
          dueno: q.data.dueno,
        }
      : null;
  const state = q.isError ? 'error' : data === null ? 'loading' : 'happy';
  const { refetch } = q;
  const recargar = useCallback(() => void refetch(), [refetch]);
  return {
    state,
    data,
    porPagar: q.isError ? null : (q.data?.recurrentes ?? null),
    registrar,
    refetch: recargar,
  };
}
