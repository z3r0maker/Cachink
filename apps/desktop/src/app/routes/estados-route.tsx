/**
 * Desktop route adapter for /estados (EstadosShell). Mirrors
 * `apps/mobile/src/app/estados.tsx` — note this one does NOT wrap in
 * the AppShell. EstadosShell provides its own chrome (it's a modal-
 * shaped screen with its own header + tabs). Matches mobile.
 */

import { useState, type ReactElement } from 'react';
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
import { useDesktopNavigate } from '../desktop-router-context';

export function EstadosRoute(): ReactElement {
  const navigate = useDesktopNavigate();
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
      onOpenSettings={() => navigate('/settings')}
    />
  );
}
