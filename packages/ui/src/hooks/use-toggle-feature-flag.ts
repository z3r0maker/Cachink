/**
 * `useToggleFeatureFlag` — TanStack mutation wrapping
 * `ToggleFeatureFlagUseCase`. Invalidates `['currentBusiness']` so
 * `useFeatureFlags()` picks up the new values and the tab layout
 * re-renders accordingly.
 *
 * Phase 3 fix — Issue 4 (Second Audit).
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { ToggleFeatureFlagUseCase, type ToggleFeatureFlagInput } from '@cachink/application';
import type { FeatureFlagKey, FeatureFlags, BusinessId } from '@cachink/domain';
import { useBusinessesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface ToggleFeatureFlagHookInput {
  readonly key: FeatureFlagKey;
  readonly newValue: boolean;
}

export type ToggleFeatureFlagResult = UseMutationResult<
  FeatureFlags,
  Error,
  ToggleFeatureFlagHookInput,
  unknown
>;

export function useToggleFeatureFlag(): ToggleFeatureFlagResult {
  const businesses = useBusinessesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  const useCase = useMemo(() => new ToggleFeatureFlagUseCase(businesses), [businesses]);

  return useMutation<FeatureFlags, Error, ToggleFeatureFlagHookInput>({
    async mutationFn(input) {
      if (!businessId) {
        throw new Error('useToggleFeatureFlag: no current business set');
      }
      const fullInput: ToggleFeatureFlagInput = {
        businessId: businessId as BusinessId,
        flagKey: input.key,
        newValue: input.newValue,
      };
      return useCase.execute(fullInput);
    },
    async onSuccess() {
      // Invalidate currentBusiness so useFeatureFlags() re-reads
      // and the tab layout updates.
      await queryClient.invalidateQueries({
        queryKey: ['currentBusiness'],
      });
    },
  });
}
