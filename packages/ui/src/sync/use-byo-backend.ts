/**
 * `useByoBackend` — reactive read/write of the `cloud.byoBackend`
 * scope in `__cachink_sync_state` (Slice 8 C4).
 *
 * `AdvancedBackendScreen` calls `save(config)` to persist a custom
 * Supabase / Postgres backend; the cloud bridges read this on every
 * boot so the BYO config takes precedence over the baked-in defaults
 * (ADR-035).
 *
 * Returns `null` when nothing is stored — the caller treats that as
 * "use the hosted defaults".
 */

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { readSyncState, writeSyncState, type CachinkDatabase } from '@cachink/data';
import { useDatabase } from '../database/_internal';
import { syncKeys } from '../hooks/query-keys';
import type { CloudBackendConfig } from './cloud-bridge';

const SCOPE = 'cloud.byoBackend' as const;

function isBackendConfig(raw: unknown): raw is CloudBackendConfig {
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as Record<string, unknown>;
  return typeof r['projectUrl'] === 'string' && typeof r['anonKey'] === 'string';
}

async function readByoBackend(db: CachinkDatabase): Promise<CloudBackendConfig | null> {
  try {
    const raw = await readSyncState(db, SCOPE);
    return isBackendConfig(raw) ? raw : null;
  } catch {
    // Table may not exist before migrations run.
    return null;
  }
}

export interface UseByoBackendResult {
  readonly config: CloudBackendConfig | null;
  readonly loading: boolean;
  readonly save: (config: CloudBackendConfig) => Promise<void>;
  readonly clear: () => Promise<void>;
}

export function useByoBackend(): UseByoBackendResult {
  const db = useDatabase();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: syncKeys.cloudByoBackend(),
    queryFn: () => readByoBackend(db),
  });

  const save = useCallback(
    async (config: CloudBackendConfig): Promise<void> => {
      await writeSyncState(db, SCOPE, config);
      void queryClient.invalidateQueries({ queryKey: syncKeys.cloudByoBackend() });
    },
    [db, queryClient],
  );

  const clear = useCallback(async (): Promise<void> => {
    // Clearing == writing `null` so the next read returns the typed null.
    await writeSyncState(db, SCOPE, null);
    void queryClient.invalidateQueries({ queryKey: syncKeys.cloudByoBackend() });
  }, [db, queryClient]);

  return {
    config: query.data ?? null,
    loading: query.isLoading,
    save,
    clear,
  };
}
