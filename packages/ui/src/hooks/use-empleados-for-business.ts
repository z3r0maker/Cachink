/**
 * `useEmpleadosForBusiness` — TanStack query listing active employees
 * for the current business.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Employee } from '@cachink/domain';
import { useEmployeesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export function useEmpleadosForBusiness(): UseQueryResult<readonly Employee[], Error> {
  const employees = useEmployeesRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly Employee[], Error>({
    queryKey: ['empleados', businessId],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      return employees.listActive(businessId);
    },
  });
}
