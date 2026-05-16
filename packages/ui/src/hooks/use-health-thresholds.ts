/**
 * `useHealthThresholds` — reads per-metric health thresholds from AppConfig.
 * `useUpdateHealthThresholds` — persists updated thresholds and invalidates.
 *
 * Follows the exact same pattern as `use-isr-defaults.ts`:
 * DB is the single source of truth; DEFAULT_HEALTH_THRESHOLDS is the
 * fallback when the AppConfig row is missing.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HealthThresholdsSchema,
  DEFAULT_HEALTH_THRESHOLDS,
  type HealthThresholds,
} from '@cachink/domain';
import { useAppConfigRepository } from '../app/repository-provider';
import { APP_CONFIG_KEYS } from '../app-config/types';

/** Query key used by both read and write hooks. */
export const healthThresholdsKey = ['healthThresholds'] as const;

export function useHealthThresholds() {
  const appConfig = useAppConfigRepository();

  return useQuery({
    queryKey: healthThresholdsKey,
    async queryFn(): Promise<HealthThresholds> {
      const raw = await appConfig.get(APP_CONFIG_KEYS.healthThresholds);
      if (!raw) return DEFAULT_HEALTH_THRESHOLDS;
      const parsed = HealthThresholdsSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : DEFAULT_HEALTH_THRESHOLDS;
    },
    initialData: DEFAULT_HEALTH_THRESHOLDS,
  });
}

export function useUpdateHealthThresholds() {
  const appConfig = useAppConfigRepository();
  const queryClient = useQueryClient();

  return useMutation({
    async mutationFn(next: HealthThresholds) {
      await appConfig.set(
        APP_CONFIG_KEYS.healthThresholds,
        JSON.stringify(next),
      );
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: healthThresholdsKey,
      });
    },
  });
}
