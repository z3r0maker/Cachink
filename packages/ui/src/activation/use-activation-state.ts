/**
 * useActivationState — whether this device has been activated.
 * `undefined` while loading, so the gate can hold the splash.
 */

import { useQuery } from '@tanstack/react-query';
import { APP_CONFIG_KEYS } from '../app-config/index';
import { useAppConfigRepository } from '../app/repository-provider';
import { parseActivationRecord, type ActivationRecord } from './activation-config';

export const ACTIVATION_QUERY_KEY = ['appConfig', 'activation'] as const;

export function useActivationState(): { record: ActivationRecord | null | undefined } {
  const appConfig = useAppConfigRepository();
  const query = useQuery({
    queryKey: ACTIVATION_QUERY_KEY,
    queryFn: async () => parseActivationRecord(await appConfig.get(APP_CONFIG_KEYS.activation)),
  });
  return { record: query.isLoading ? undefined : (query.data ?? null) };
}
