/**
 * NuevoEmpleadoModal — mid-Nómina-tab empleado creation (Slice 2 C4).
 *
 * Fields: nombre (required), puesto (required), salario (pesos),
 * periodo (select: semanal/quincenal/mensual). Submit bubbles a
 * CrearEmpleadoInput payload; parent wires `useCrearEmpleado`.
 *
 * Form fields are imported from the shared `empleado-form-fields.tsx`
 * component (CLAUDE.md §2 Principle #3 — code lives in one place).
 */

import { useState, type ReactElement } from 'react';
import { fromPesos } from '@cachink/domain';
import type { CrearEmpleadoInput } from '../../../hooks/use-crear-empleado';
import { Btn, Modal } from '../../../components/index';
import { useTranslation } from '../../../i18n/index';
import {
  EmpleadoFields,
  emptyEmpleadoForm,
  validateEmpleadoForm,
  type EmpleadoFormErrors,
  type EmpleadoFormState,
} from '../../Settings/empleado-form-fields';

export interface NuevoEmpleadoModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: CrearEmpleadoInput) => void;
  readonly submitting?: boolean;
}

function buildPayload(state: EmpleadoFormState): CrearEmpleadoInput {
  return {
    nombre: state.nombre.trim(),
    puesto: state.puesto.trim(),
    salario: fromPesos(state.salarioPesos),
    periodo: state.periodo,
  };
}

function makeSubmitHandler(
  state: EmpleadoFormState,
  setErrors: (e: EmpleadoFormErrors) => void,
  setState: (s: EmpleadoFormState) => void,
  required: string,
  onSubmit: NuevoEmpleadoModalProps['onSubmit'],
): () => void {
  return () => {
    const v = validateEmpleadoForm(state, required);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setErrors({});
    onSubmit(buildPayload(state));
    setState(emptyEmpleadoForm());
  };
}

export function NuevoEmpleadoModal(props: NuevoEmpleadoModalProps): ReactElement {
  const { t } = useTranslation();
  const [state, setState] = useState<EmpleadoFormState>(emptyEmpleadoForm);
  const [errors, setErrors] = useState<EmpleadoFormErrors>({});
  const update = (p: Partial<EmpleadoFormState>): void => setState((prev) => ({ ...prev, ...p }));
  const handleSubmit = makeSubmitHandler(
    state,
    setErrors,
    setState,
    t('empleados.required'),
    props.onSubmit,
  );

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('empleados.nuevo')}
      testID="nuevo-empleado-modal"
    >
      <EmpleadoFields
        state={state}
        update={update}
        errors={errors}
        onSubmitEditing={handleSubmit}
        t={t}
      />
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
