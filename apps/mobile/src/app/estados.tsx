/**
 * Expo Router entry for the Estados Financieros shell (P1C-M8, Slice 3 C19).
 *
 * App-shell only per CLAUDE.md §5.6. Wires:
 *   - The four hooks (`useEstadoResultados`, `useBalanceGeneral`,
 *     `useFlujoEfectivo`, `useIndicadores`) to a single PeriodoState.
 *   - The shared `EstadosShell` from `@cachink/ui`.
 *
 * State lives in Zustand / TanStack Query, not here; this file stays
 * slim so desktop can mount the same shell with its own router wiring.
 */

import { useState, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  EstadosShell,
  defaultPeriodoState,
  useBalanceGeneral,
  useEstadoResultados,
  useFlujoEfectivo,
  useIndicadores,
  usePeriodoRange,
  type PeriodoState,
} from '@cachink/ui';

export default function EstadosRoute(): ReactElement {
  const router = useRouter();
  const [periodoState, setPeriodoState] = useState<PeriodoState>(() => defaultPeriodoState());
  const periodo = usePeriodoRange(periodoState);
  const periodoLabel = `${periodo.from} → ${periodo.to}`;

  const estado = useEstadoResultados({ periodo });
  const balance = useBalanceGeneral({ periodo });
  const flujo = useFlujoEfectivo({ periodo });
  const indicadores = useIndicadores({ periodo });

  const informeYearMonth =
    periodoState.mode === 'mensual' && periodoState.year && periodoState.month
      ? `${periodoState.year}-${periodoState.month}`
      : undefined;

  return (
    <EstadosShell
      periodoState={periodoState}
      onPeriodoChange={setPeriodoState}
      periodoLabel={periodoLabel}
      estado={estado.data ?? null}
      balance={balance.data ?? null}
      flujo={flujo.data ?? null}
      indicadores={indicadores.data ?? null}
      informeYearMonth={informeYearMonth}
      onOpenSettings={() => router.push('/settings' as never)}
    />
  );
}
