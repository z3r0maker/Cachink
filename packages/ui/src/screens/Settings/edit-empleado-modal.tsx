/**
 * EditEmpleadoModal — edit an existing employee from Settings → Empleados.
 *
 * Reuses EmpleadoFields (shared with NuevoEmpleadoModal) per CLAUDE.md
 * §2 Principle #3. Prefills form from the existing employee data.
 */

import { useState, type ReactElement } from 'react';
import { fromPesos, toPesosString, type Employee } from '@cachink/domain';
import type { EditEmpleadoInput } from '../../hooks/use-edit-empleado';
import { Btn, Modal } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import {
  EmpleadoFields,
  validateEmpleadoForm,
  type EmpleadoFormErrors,
  type EmpleadoFormState,
} from './empleado-form-fields';

export interface EditEmpleadoModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly employee: Employee;
  readonly onSubmit: (input: EditEmpleadoInput) => void;
  readonly submitting?: boolean;
}

function stateFromEmployee(e: Employee): EmpleadoFormState {
  return {
    nombre: e.nombre,
    puesto: e.puesto,
    salarioPesos: toPesosString(e.salarioCentavos),
    periodo: e.periodo,
  };
}

function useEditEmpleadoForm(employee: Employee, onSubmit: (i: EditEmpleadoInput) => void) {
  const { t } = useTranslation();
  const [state, setState] = useState<EmpleadoFormState>(() => stateFromEmployee(employee));
  const [errors, setErrors] = useState<EmpleadoFormErrors>({});
  const update = (p: Partial<EmpleadoFormState>): void => setState((prev) => ({ ...prev, ...p }));
  const handleSubmit = (): void => {
    const v = validateEmpleadoForm(state, t('empleados.required'));
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setErrors({});
    onSubmit({
      id: employee.id,
      nombre: state.nombre.trim(),
      puesto: state.puesto.trim(),
      salario: fromPesos(state.salarioPesos),
      periodo: state.periodo,
    });
  };
  return { state, errors, update, handleSubmit };
}

export function EditEmpleadoModal(props: EditEmpleadoModalProps): ReactElement {
  const { t } = useTranslation();
  const { state, errors, update, handleSubmit } = useEditEmpleadoForm(
    props.employee,
    props.onSubmit,
  );
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('empleados.editTitle')}
      testID="edit-empleado-modal"
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
        loading={props.submitting === true}
        fullWidth
        testID="empleado-edit-submit"
      >
        {t('empleados.save')}
      </Btn>
    </Modal>
  );
}
