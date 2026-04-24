/**
 * NuevoEmpleadoModal — mid-Nómina-tab empleado creation (Slice 2 C4).
 *
 * Fields: nombre (required), puesto (required), salario (pesos),
 * periodo (select: semanal/quincenal/mensual). Submit bubbles a
 * CrearEmpleadoInput payload; parent wires `useCrearEmpleado`.
 */

import { useState, type ReactElement } from 'react';
import { fromPesos, type PayrollFrequency } from '@cachink/domain';
import type { CrearEmpleadoInput } from '../../../hooks/use-crear-empleado';
import { Btn, Input, Modal } from '../../../components/index';
import { useTranslation } from '../../../i18n/index';

const PERIODOS: readonly PayrollFrequency[] = ['semanal', 'quincenal', 'mensual'];

export interface NuevoEmpleadoModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: CrearEmpleadoInput) => void;
  readonly submitting?: boolean;
}

interface FormState {
  nombre: string;
  puesto: string;
  salarioPesos: string;
  periodo: PayrollFrequency;
}

interface FormErrors {
  nombre?: string;
  puesto?: string;
  salario?: string;
}

function initialState(): FormState {
  return { nombre: '', puesto: '', salarioPesos: '', periodo: 'quincenal' };
}

function validate(state: FormState, requiredLabel: string): FormErrors {
  const errors: FormErrors = {};
  if (!state.nombre.trim()) errors.nombre = requiredLabel;
  if (!state.puesto.trim()) errors.puesto = requiredLabel;
  const s = Number(state.salarioPesos);
  if (!Number.isFinite(s) || s <= 0) errors.salario = requiredLabel;
  return errors;
}

interface FieldsProps {
  readonly state: FormState;
  readonly update: (p: Partial<FormState>) => void;
  readonly errors: FormErrors;
  readonly t: ReturnType<typeof useTranslation>['t'];
}

function EmpleadoFields(props: FieldsProps): ReactElement {
  const { state, update, errors, t } = props;
  return (
    <>
      <Input
        label={t('empleados.nombreLabel')}
        value={state.nombre}
        onChange={(v) => update({ nombre: v })}
        note={errors.nombre}
        testID="empleado-nombre"
      />
      <Input
        label={t('empleados.puestoLabel')}
        value={state.puesto}
        onChange={(v) => update({ puesto: v })}
        note={errors.puesto}
        testID="empleado-puesto"
      />
      <Input
        type="number"
        label={t('empleados.salarioLabel')}
        value={state.salarioPesos}
        onChange={(v) => update({ salarioPesos: v })}
        note={errors.salario}
        testID="empleado-salario"
      />
      <Input
        type="select"
        label={t('empleados.periodoLabel')}
        value={state.periodo}
        onChange={(v) => update({ periodo: v as PayrollFrequency })}
        options={PERIODOS}
        testID="empleado-periodo"
      />
    </>
  );
}

export function NuevoEmpleadoModal(props: NuevoEmpleadoModalProps): ReactElement {
  const { t } = useTranslation();
  const [state, setState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const update = (p: Partial<FormState>): void => setState((prev) => ({ ...prev, ...p }));

  const handleSubmit = (): void => {
    const v = validate(state, t('empleados.required'));
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setErrors({});
    props.onSubmit({
      nombre: state.nombre.trim(),
      puesto: state.puesto.trim(),
      salario: fromPesos(state.salarioPesos),
      periodo: state.periodo,
    });
    setState(initialState());
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('empleados.nuevo')}
      testID="nuevo-empleado-modal"
    >
      <EmpleadoFields state={state} update={update} errors={errors} t={t} />
      <Btn
        variant="primary"
        onPress={handleSubmit}
        disabled={props.submitting === true}
        fullWidth
        testID="empleado-submit"
      >
        {t('empleados.save')}
      </Btn>
    </Modal>
  );
}
