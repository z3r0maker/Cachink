/**
 * PendientesDirectorCard — Director-side variant of PendientesCard
 * (P1C-M10, S4-C7). Cross-role visibility per CLAUDE.md §1 — Director
 * can see the same pendientes stack and confirm them.
 *
 * Composes `usePendientesGastosRecurrentes(today)` +
 * `useProcesarGastoRecurrente`. Returns null on empty to avoid an
 * empty grid cell on the Director Home.
 */

import { useMemo, type ReactElement } from 'react';
import type { IsoDate } from '@cachink/domain';
import { usePendientesGastosRecurrentes, useProcesarGastoRecurrente } from '../../hooks/index';
import { PendientesCard } from '../Egresos/pendientes-card';
import { todayIso } from './hoy-kpi-strip';

export interface PendientesDirectorCardProps {
  readonly testID?: string;
  readonly now?: Date;
}

export function PendientesDirectorCard(props: PendientesDirectorCardProps): ReactElement | null {
  const today = useMemo<IsoDate>(() => todayIso(props.now), [props.now]);
  const pendientesQ = usePendientesGastosRecurrentes(today);
  const procesar = useProcesarGastoRecurrente();
  const pendientes = pendientesQ.data ?? [];

  if (pendientes.length === 0) return null;

  return (
    <PendientesCard
      testID={props.testID ?? 'pendientes-director-card'}
      pendientes={pendientes}
      onConfirmar={(p) => procesar.mutate({ template: p, today })}
      confirming={procesar.isPending}
    />
  );
}
