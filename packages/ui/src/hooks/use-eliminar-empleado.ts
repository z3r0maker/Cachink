/**
 * `useEliminarEmpleado` — TanStack mutation wrapping
 * EmployeesRepository.delete (soft-delete). Invalidates
 * ['empleados', businessId] on success.
 */

import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { EmployeeId } from '@cachink/domain';
import { useEmployeesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { useAuditedMutation } from '../observability/use-audited-mutation';
import { MUTATION_ELIMINAR_EMPLEADO } from '../observability/audit-configs';

export type EliminarEmpleadoResult = UseMutationResult<void, Error, EmployeeId, unknown>;

export function useEliminarEmpleado(): EliminarEmpleadoResult {
  const employees = useEmployeesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useAuditedMutation(MUTATION_ELIMINAR_EMPLEADO, {
    async mutationFn(id) {
      await employees.delete(id);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['empleados', businessId] });
    },
  });
}
