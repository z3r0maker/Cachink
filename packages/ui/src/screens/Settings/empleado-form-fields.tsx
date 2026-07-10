/**
 * EmpleadoFields — shared form fields for employee create/edit.
 *
 * Extracted from `nuevo-empleado-modal.tsx` to satisfy CLAUDE.md §2
 * Principle #3 (code lives in exactly one place). Both the Nómina-tab
 * NuevoEmpleadoModal and the Settings EditEmpleadoModal import these.
 */

import { useRef, type ReactElement } from 'react';
import { type TextInput } from 'react-native';
import type { PayrollFrequency } from '@cachink/domain';
import { focusRef, MoneyField, TextField } from '../../components/fields/index';
import { OptionCardGroup, type OptionCardItem } from '../../components/OptionCardGroup/index';
import type { useTranslation } from '../../i18n/index';

const PERIODO_CARDS: readonly OptionCardItem<PayrollFrequency>[] = [
  {
    key: 'semanal',
    icon: 'zap',
    label: 'Semanal',
    description: 'Pago cada semana.',
  },
  {
    key: 'quincenal',
    icon: 'coins',
    label: 'Quincenal',
    description: 'Pago cada 15 días.',
  },
  {
    key: 'mensual',
    icon: 'calendar',
    label: 'Mensual',
    description: 'Pago una vez al mes.',
  },
];

export interface EmpleadoFormState {
  nombre: string;
  puesto: string;
  salarioPesos: string;
  periodo: PayrollFrequency;
}

export interface EmpleadoFormErrors {
  nombre?: string;
  puesto?: string;
  salario?: string;
}

export function emptyEmpleadoForm(): EmpleadoFormState {
  return { nombre: '', puesto: '', salarioPesos: '', periodo: 'quincenal' };
}

export function validateEmpleadoForm(
  state: EmpleadoFormState,
  requiredLabel: string,
): EmpleadoFormErrors {
  const errors: EmpleadoFormErrors = {};
  if (!state.nombre.trim()) errors.nombre = requiredLabel;
  if (!state.puesto.trim()) errors.puesto = requiredLabel;
  const s = Number(state.salarioPesos);
  if (!Number.isFinite(s) || s <= 0) errors.salario = requiredLabel;
  return errors;
}

export interface EmpleadoFieldsProps {
  readonly state: EmpleadoFormState;
  readonly update: (p: Partial<EmpleadoFormState>) => void;
  readonly errors: EmpleadoFormErrors;
  /** Audit 5.4 — Bluetooth-keyboard Enter-to-submit. */
  readonly onSubmitEditing?: () => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
}

function PeriodoSelector({ state, update, t }: {
  state: EmpleadoFormState; update: (p: Partial<EmpleadoFormState>) => void;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <OptionCardGroup
      label={t('empleados.periodoLabel')}
      value={state.periodo}
      onChange={(v) => update({ periodo: v })}
      options={PERIODO_CARDS}
      testID="empleado-periodo"
    />
  );
}

export function EmpleadoFields({ state, update, errors, t, onSubmitEditing }: EmpleadoFieldsProps): ReactElement {
  const puestoRef = useRef<TextInput>(null);
  const salarioRef = useRef<TextInput>(null);
  return (
    <>
      <TextField
        label={t('empleados.nombreLabel')}
        value={state.nombre}
        onChange={(v) => update({ nombre: v })}
        note={errors.nombre}
        testID="empleado-nombre"
        returnKeyType="next"
        onSubmitEditing={() => focusRef(puestoRef)}
        blurOnSubmit={false}
      />
      <TextField
        label={t('empleados.puestoLabel')}
        value={state.puesto}
        onChange={(v) => update({ puesto: v })}
        note={errors.puesto}
        testID="empleado-puesto"
        returnKeyType="next"
        inputRef={puestoRef}
        onSubmitEditing={() => focusRef(salarioRef)}
        blurOnSubmit={false}
      />
      <MoneyField
        label={t('empleados.salarioLabel')}
        value={state.salarioPesos}
        onChange={(v) => update({ salarioPesos: v })}
        note={errors.salario}
        testID="empleado-salario"
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
        inputRef={salarioRef}
      />
      <PeriodoSelector state={state} update={update} t={t} />
    </>
  );
}
