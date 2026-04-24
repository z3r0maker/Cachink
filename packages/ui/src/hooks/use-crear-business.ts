/**
 * `useCrearBusiness` — TanStack mutation that wraps the two-step "create
 * a business and make it the current one" flow from the wizard.
 *
 * The mutation:
 *   1. Calls `BusinessesRepository.create` with the form payload, filling
 *      in `logoUrl: null` and a placeholder `businessId` (repositories
 *      overwrite this with the new row's id).
 *   2. Writes the resulting business id to `AppConfig` under
 *      `currentBusinessId` so subsequent launches skip the wizard.
 *   3. Hydrates the Zustand store with the same id so screens render
 *      without waiting on a query refetch.
 *
 * Invalidates the `['currentBusiness']` query on success so
 * {@link useCurrentBusiness} picks up the new row immediately.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useAppConfigRepository, useBusinessesRepository } from '../app/index';
import { APP_CONFIG_KEYS, useSetCurrentBusinessId, type Role } from '../app-config/index';
import type { Business, BusinessId, DeviceId } from '@cachink/domain';
import type { BusinessFormSubmitInput } from '../screens/BusinessForm/index';
import { useDeviceId } from '../app-config/use-app-config';

// Role is re-exported via the barrel for apps that import from '@cachink/ui/hooks'.
export type { Role };

export type CrearBusinessResult = UseMutationResult<
  Business,
  Error,
  BusinessFormSubmitInput,
  unknown
>;

export function useCrearBusiness(): CrearBusinessResult {
  const businesses = useBusinessesRepository();
  const appConfig = useAppConfigRepository();
  const setCurrentBusinessId = useSetCurrentBusinessId();
  const queryClient = useQueryClient();
  const deviceId = useDeviceId();

  return useMutation<Business, Error, BusinessFormSubmitInput>({
    async mutationFn(input) {
      // Repositories overwrite businessId with the freshly-minted id + audit
      // timestamps. We pass a placeholder so the NewBusiness schema parses.
      const placeholder = {
        ...input,
        logoUrl: null,
        businessId: '01JPHK00000000000000000000' as BusinessId,
        deviceId: (deviceId ?? '01JPHK00000000000000000001') as DeviceId,
      };
      return businesses.create(placeholder);
    },
    async onSuccess(business) {
      await appConfig.set(APP_CONFIG_KEYS.currentBusinessId, business.id);
      setCurrentBusinessId(business.id);
      await queryClient.invalidateQueries({ queryKey: ['currentBusiness'] });
    },
  });
}
