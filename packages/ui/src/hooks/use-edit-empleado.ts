/**
 * `useEditEmpleado` — TanStack mutation wrapping
 * EmployeesRepository.update. Invalidates ['empleados', businessId]
 * on success so employee lists refresh immediately.
 */

import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { Employee, EmployeeId, Money, PayrollFrequency } from '@cachink/domain';
import type { UpdateEmployee } from '@cachink/data';
import { useEmployeesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { useAuditedMutation } from '../observability/use-audited-mutation';
import { MUTATION_EDITAR_EMPLEADO } from '../observability/audit-configs';

export interface EditEmpleadoInput {
  readonly id: EmployeeId;
  readonly nombre?: string;
  readonly puesto?: string;
  readonly salario?: Money;
  readonly periodo?: PayrollFrequency;
}

export type EditEmpleadoResult = UseMutationResult<Employee, Error, EditEmpleadoInput, unknown>;

export function useEditEmpleado(): EditEmpleadoResult {
  const employees = useEmployeesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useAuditedMutation(MUTATION_EDITAR_EMPLEADO, {
    async mutationFn(input) {
      const payload: UpdateEmployee = {};
      if (input.nombre !== undefined) payload.nombre = input.nombre;
      if (input.puesto !== undefined) payload.puesto = input.puesto;
      if (input.salario !== undefined) payload.salarioCentavos = input.salario;
      if (input.periodo !== undefined) payload.periodo = input.periodo;
      return employees.update(input.id, payload);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['empleados', businessId] });
    },
  });
}
