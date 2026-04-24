/**
 * `useCrearEmpleado` — TanStack mutation wrapping
 * EmployeesRepository.create. Invalidates ['empleados', businessId]
 * on success so the Nómina select picks up the new row immediately.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { BusinessId, Employee, NewEmployee, PayrollFrequency } from '@cachink/domain';
import type { Money } from '@cachink/domain';
import { useEmployeesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface CrearEmpleadoInput {
  readonly nombre: string;
  readonly puesto: string;
  readonly salario: Money;
  readonly periodo: PayrollFrequency;
}

export type CrearEmpleadoResult = UseMutationResult<Employee, Error, CrearEmpleadoInput, unknown>;

export function useCrearEmpleado(): CrearEmpleadoResult {
  const employees = useEmployeesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useMutation<Employee, Error, CrearEmpleadoInput>({
    async mutationFn(input) {
      if (!businessId) throw new Error('useCrearEmpleado: no current business');
      const payload: NewEmployee = {
        nombre: input.nombre,
        puesto: input.puesto,
        salarioCentavos: input.salario,
        periodo: input.periodo,
        businessId: businessId as BusinessId,
      };
      return employees.create(payload);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['empleados', businessId] });
    },
  });
}
