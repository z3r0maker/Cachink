/**
 * `useIsrDefaults` — reads per-regime ISR default rates from AppConfig.
 * `useUpdateIsrDefaults` — persists updated rates and invalidates the cache.
 *
 * The DB is the single source of truth; ISR_DEFAULTS_SEED is a fallback
 * only if the AppConfig row is somehow missing.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IsrDefaultsSchema, ISR_DEFAULTS_SEED, type IsrDefaults } from '@cachink/domain';
import { useAppConfigRepository } from '../app/repository-provider';
import { APP_CONFIG_KEYS } from '../app-config/types';

/** Query key used by both read and write hooks. */
export const isrDefaultsKey = ['isrDefaults'] as const;

export function useIsrDefaults() {
  const appConfig = useAppConfigRepository();

  return useQuery({
    queryKey: isrDefaultsKey,
    async queryFn(): Promise<IsrDefaults> {
      const raw = await appConfig.get(APP_CONFIG_KEYS.isrDefaults);
      if (!raw) return ISR_DEFAULTS_SEED;
      const parsed = IsrDefaultsSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : ISR_DEFAULTS_SEED;
    },
    // Provide seed values as initialData so `data` is never `undefined`
    // during the query's loading phase.  Without this, the BusinessForm's
    // regime-change handler sees `isrDefaults === undefined` on the very
    // first interaction and skips the auto-fill.
    initialData: ISR_DEFAULTS_SEED,
  });
}

export function useUpdateIsrDefaults() {
  const appConfig = useAppConfigRepository();
  const queryClient = useQueryClient();

  return useMutation({
    async mutationFn(next: IsrDefaults) {
      await appConfig.set(APP_CONFIG_KEYS.isrDefaults, JSON.stringify(next));
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: isrDefaultsKey });
    },
  });
}
