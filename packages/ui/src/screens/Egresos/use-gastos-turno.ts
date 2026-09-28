/**
 * The Gastos screen's data (MvGastos; the web caja's `gastosDelTurno`,
 * `registrarGasto` and `pagarRecurrente`): the open turno's expenses, and a
 * new one recorded through `RegistrarEgresoUseCase` scoped to the turno, or,
 * when it pays a due recurring gasto, through `ProcesarGastoRecurrenteUseCase`
 * so the template's schedule advances. Without an open turno it lists today's.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { BusinessId, Expense, IsoDate, RecurringExpense } from '@xangarro/domain';
import { categoriaDominio, hoyLocal } from '@xangarro/caja';
import type { GastoTurno, NuevoGasto } from '@xangarro/caja/gastos';
import { useExpensesRepository } from '../../app/index';
import { useCurrentBusinessId } from '../../app-config/index';
import { useOpenCajaTurno } from '../../hooks/use-open-caja-turno';
import { useRegistrarEgreso } from '../../hooks/use-registrar-egreso';
import { useProcesarGastoRecurrente } from '../../hooks/use-procesar-gasto-recurrente';
import { egresoDe, gastoDeEgreso, gastosDelTurno } from './gastos-lectura';

export type EstadoGastos = 'loading' | 'error' | 'empty' | 'happy';

export const gastosTurnoKeys = {
  turno: (b: BusinessId | null, turnoId: string | null, hoy: string) =>
    ['egresos', b, hoy, 'turno', turnoId] as const,
};

export function useGastosTurno() {
  const expenses = useExpensesRepository();
  const businessId = useCurrentBusinessId();
  const { openTurno, isLoading } = useOpenCajaTurno();
  const hoy = hoyLocal();
  const q = useQuery({
    queryKey: gastosTurnoKeys.turno(businessId, openTurno?.id ?? null, hoy),
    enabled: businessId !== null && !isLoading,
    queryFn: async (): Promise<readonly Expense[]> => {
      const deHoy = await expenses.findByDate(hoy as IsoDate, businessId as BusinessId);
      if (openTurno === null) return deHoy;
      const delTurno = await expenses.findByCajaTurno(openTurno.id);
      return gastosDelTurno(delTurno, deHoy, openTurno);
    },
  });
  const gastos: readonly GastoTurno[] = (q.data ?? []).map(gastoDeEgreso);
  const state: EstadoGastos =
    isLoading || q.isLoading ? 'loading' : q.isError ? 'error' : gastos.length ? 'happy' : 'empty';
  return {
    state,
    gastos,
    hoy,
    turnoDesde: openTurno ? openTurno.aperturaAt : null,
    conTurno: openTurno !== null,
    refetch: () => void q.refetch(),
  };
}

/** Save a gasto; a recurring one pays its template, or falls back to a plain gasto. */
export function useRegistrarGasto(pendientes: readonly RecurringExpense[]) {
  const registrar = useRegistrarEgreso();
  const procesar = useProcesarGastoRecurrente();
  const businessId = useCurrentBusinessId();
  const { openTurno } = useOpenCajaTurno();
  const queryClient = useQueryClient();
  const guardar = async (n: NuevoGasto): Promise<void> => {
    if (!businessId) throw new Error('No hay negocio en esta caja');
    const hoy = hoyLocal() as IsoDate;
    const turnoId = openTurno?.id ?? null;
    const template = pendientes.find((r) => r.id === n.recurrenteId);
    if (template !== undefined) {
      const r = await procesar.mutateAsync({
        template,
        today: hoy,
        captura: {
          concepto: n.concepto,
          categoria: categoriaDominio(n.categoria),
          monto: n.monto,
          proveedor: n.proveedor,
          cajaTurnoId: turnoId as never,
        },
      });
      if (r.processed) {
        await queryClient.invalidateQueries({ queryKey: ['egresos', businessId] });
        return;
      }
    }
    await registrar.mutateAsync(egresoDe(n, { businessId, fecha: hoy, turnoId }));
    await queryClient.invalidateQueries({ queryKey: ['egresos', businessId] });
  };
  return { guardar, guardando: registrar.isPending || procesar.isPending };
}
