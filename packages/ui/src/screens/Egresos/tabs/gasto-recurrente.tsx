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
import { Input } from '../../../components/index';
import { IntegerField } from '../../../components/fields/index';
import { useTranslation } from '../../../i18n/index';

export const FRECUENCIAS: readonly RecurrenceFrequency[] = ['semanal', 'quincenal', 'mensual'];

export interface RecurrenteState {
  frecuencia: RecurrenceFrequency;
  diaDelMes: string;
  diaDeLaSemana: string;
}

export function initialRecurrenteState(): RecurrenteState {
  return { frecuencia: 'mensual', diaDelMes: '1', diaDeLaSemana: '' };
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
  const diaDelMes = state.frecuencia !== 'semanal' ? Number(state.diaDelMes) : undefined;
  const diaDeLaSemana = state.frecuencia !== 'mensual' ? Number(state.diaDeLaSemana) : undefined;
  if (state.frecuencia === 'semanal' && !Number.isInteger(diaDeLaSemana)) return null;
  if (state.frecuencia === 'mensual' && !Number.isInteger(diaDelMes)) return null;
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
      <Input
        type="select"
        label={t('nuevoEgreso.frecuenciaLabel')}
        value={state.frecuencia}
        onChange={(v) => update({ frecuencia: v as RecurrenceFrequency })}
        options={FRECUENCIAS}
        testID="recurrente-frecuencia"
      />
      {state.frecuencia !== 'semanal' && (
        <IntegerField
          label={t('nuevoEgreso.diaDelMesLabel')}
          value={state.diaDelMes}
          onChange={(v) => update({ diaDelMes: v })}
          min={1}
          max={31}
          testID="recurrente-dia-mes"
        />
      )}
      {state.frecuencia !== 'mensual' && (
        <IntegerField
          label={t('nuevoEgreso.diaDeLaSemanaLabel')}
          value={state.diaDeLaSemana}
          onChange={(v) => update({ diaDeLaSemana: v })}
          min={0}
          max={6}
          testID="recurrente-dia-semana"
        />
      )}
    </>
  );
}
