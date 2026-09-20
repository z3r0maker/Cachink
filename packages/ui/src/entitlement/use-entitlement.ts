/**
 * useEntitlement — the verified plan this device enforces (A-10).
 *
 * Reads what sync stored (signed entitlement, last server time, last pull)
 * and resolves it with `@xangarro/sync`'s verifier. Keyed under the cloud
 * sync prefix so it refreshes after every sync run.
 */

import { useQuery } from '@tanstack/react-query';
import { resolveEntitlement, type ResolvedEntitlement } from '@xangarro/sync';
import { APP_CONFIG_KEYS } from '../app-config/index';
import { useActivationContext } from '../activation/activation-context';
import { CLOUD_SYNC_QUERY_KEY } from '../app/cloud-sync-bridge';
import { useAppConfigRepository } from '../app/repository-provider';

export const ENTITLEMENT_QUERY_KEY = [...CLOUD_SYNC_QUERY_KEY, 'entitlement'] as const;

/** `undefined` while loading. */
export function useEntitlement(): ResolvedEntitlement | undefined {
  const appConfig = useAppConfigRepository();
  const { config } = useActivationContext();
  const query = useQuery({
    queryKey: ENTITLEMENT_QUERY_KEY,
    queryFn: async () => {
      const [storedJson, lastServerTime, lastPullAt] = await Promise.all([
        appConfig.get(APP_CONFIG_KEYS.entitlement),
        appConfig.get(APP_CONFIG_KEYS.lastServerTime),
        appConfig.get(APP_CONFIG_KEYS.lastPullAt),
      ]);
      return resolveEntitlement({
        storedJson,
        lastServerTime,
        lastPullAt,
        deviceNow: new Date(),
        publicKeyHex: config.entitlementPublicKeyHex,
      });
    },
  });
  return query.data;
}
