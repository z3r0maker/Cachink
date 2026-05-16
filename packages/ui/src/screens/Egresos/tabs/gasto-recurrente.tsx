/**
 * GastoRecurrenteFields — the extra fields shown on GastoTab when the
 * user toggles "Marcar como recurrente" (Slice 2 C6, M4-T03).
 *
 * Fields: frecuencia (semanal/quincenal/mensual), día_del_mes (1-31)
 * when mensual/quincenal, día_de_la_semana (0-6) when semanal/quincenal.
 *
 * Keeps the Gasto form focused — this file owns everything recurrente.
 */

import type { ReactElement } from 'react';
import type { NewRecurringExpense, RecurrenceFrequency } from '@cachink/domain';
import { OptionCardGroup, type OptionCardItem } from '../../../components/OptionCardGroup/index';
import { WheelQuantityPicker } from '../../../components/fields/index';
import { useTranslation } from '../../../i18n/index';

export const FRECUENCIAS: readonly RecurrenceFrequency[] = ['semanal', 'quincenal', 'mensual'];

/** Abbreviated day-of-week labels for the wheel picker (Mon–Sun, es-MX). */
export const DIAS_SEMANA_CORTO: readonly string[] = [
  'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom',
];

export const FRECUENCIA_CARDS: readonly OptionCardItem<RecurrenceFrequency>[] = [
  {
    key: 'semanal',
    icon: 'zap',
    label: 'Semanal',
    description: 'Se registra cada semana.',
  },
  {
    key: 'quincenal',
    icon: 'coins',
    label: 'Quincenal',
    description: 'Se registra cada 15 días.',
  },
  {
    key: 'mensual',
    icon: 'calendar',
    label: 'Mensual',
    description: 'Se registra una vez al mes.',
  },
];

export interface RecurrenteState {
  frecuencia: RecurrenceFrequency;
  diaDelMes: number;
  diaDeLaSemana: number;
}

export function initialRecurrenteState(): RecurrenteState {
  return { frecuencia: 'mensual', diaDelMes: 1, diaDeLaSemana: 0 };
}

/**
 * Build a NewRecurringExpense from the UI state + the egreso's concepto /
 * categoria / monto / proveedor. Returns null if the recurrente state
 * is invalid.
 */
export function buildRecurrenteDraft(
  state: RecurrenteState,
  base: Pick<
    NewRecurringExpense,
    'concepto' | 'categoria' | 'montoCentavos' | 'proveedor' | 'businessId'
  >,
  proximoDisparo: NewRecurringExpense['proximoDisparo'],
): NewRecurringExpense | null {
  const diaDelMes = state.frecuencia !== 'semanal' ? state.diaDelMes : undefined;
  const diaDeLaSemana = state.frecuencia !== 'mensual' ? state.diaDeLaSemana : undefined;
  return {
    ...base,
    frecuencia: state.frecuencia,
    diaDelMes: diaDelMes ?? undefined,
    diaDeLaSemana: diaDeLaSemana ?? undefined,
    proximoDisparo,
    activo: true,
  };
}

export interface GastoRecurrenteFieldsProps {
  readonly state: RecurrenteState;
  readonly update: (partial: Partial<RecurrenteState>) => void;
}

export function GastoRecurrenteFields(props: GastoRecurrenteFieldsProps): ReactElement {
  const { t } = useTranslation();
  const { state, update } = props;
  return (
    <>
      <OptionCardGroup
        label={t('nuevoEgreso.frecuenciaLabel')}
        value={state.frecuencia}
        onChange={(v) => update({ frecuencia: v })}
        options={FRECUENCIA_CARDS}
        testID="recurrente-frecuencia"
      />
      {state.frecuencia !== 'semanal' && (
        <WheelQuantityPicker
          label={t('nuevoEgreso.diaDelMesLabel')}
          value={state.diaDelMes}
          onChange={(v) => update({ diaDelMes: v })}
          min={1}
          max={31}
          testID="recurrente-dia-mes"
        />
      )}
      {state.frecuencia !== 'mensual' && (
        <WheelQuantityPicker
          label={t('nuevoEgreso.diaDeLaSemanaLabel')}
          value={state.diaDeLaSemana}
          onChange={(v) => update({ diaDeLaSemana: v })}
          min={0}
          max={6}
          options={DIAS_SEMANA_CORTO}
          testID="recurrente-dia-semana"
        />
      )}
    </>
  );
}
