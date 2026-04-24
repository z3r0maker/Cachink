/**
 * `useCurrentBusiness` — TanStack query that resolves the active
 * business row using the `currentBusinessId` value from the Zustand
 * store (populated by `AppConfigProvider` on mount).
 *
 * Returns `null` when no business has been created yet — the wizard
 * hasn't completed. Callers gate rendering on that sentinel.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Business } from '@cachink/domain';
import { useBusinessesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export function useCurrentBusiness(): UseQueryResult<Business | null, Error> {
  const businesses = useBusinessesRepository();
  const currentBusinessId = useCurrentBusinessId();

  return useQuery<Business | null, Error>({
    queryKey: ['currentBusiness', currentBusinessId],
    enabled: currentBusinessId !== null,
    async queryFn() {
      if (!currentBusinessId) return null;
      return businesses.findById(currentBusinessId);
    },
  });
}
