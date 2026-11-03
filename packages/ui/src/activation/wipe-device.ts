/**
 * wipeDevice — «Desvincular y borrar» (MvDesvincularBorrar). Unlinks this
 * device and empties everything it keeps; `forgetDevice` is the unlink that
 * keeps the data.
 *
 * Nothing unsent is ever destroyed: the counts are read again from the
 * database right before the wipe, not from the pill's last run, and the wipe
 * stops when anything is still waiting or refused.
 *
 * The token goes first, so no pull can write rows back while the tables
 * empty. The last row written is the «Listo» flag the connect screen reads;
 * then the app restarts, which also drops what is held in memory (the
 * ticket in progress, the cart, cached queries).
 */

import type { QueryClient } from '@tanstack/react-query';
import { wipeLocalData, type AppConfigRepository, type XangarroDatabase } from '@xangarro/data';
import type { SyncCounts } from '@xangarro/sync';
import { APP_CONFIG_KEYS } from '../app-config/types';
import { useAppConfigStore } from '../app-config/use-app-config';
import type { DeviceTokenStore } from './activation-config';

/** What the wipe would destroy: rows not accepted yet, and refused ones. */
export function sinEnviar(counts: SyncCounts): number {
  return counts.unsent + counts.rejected;
}

export type WipeResult =
  | { readonly kind: 'borrado' }
  | { readonly kind: 'pendiente'; readonly sinEnviar: number };

export interface WipeDeviceDeps {
  readonly db: XangarroDatabase;
  readonly appConfig: AppConfigRepository;
  readonly tokenStore: DeviceTokenStore;
  readonly queryClient: QueryClient;
  /** Fresh counts from the database (the sync engine's). */
  readonly contar: () => Promise<SyncCounts>;
  /** Restarts the app; absent where it cannot (tests, web). */
  readonly reiniciar?: () => void;
  readonly now?: () => Date;
}

export async function wipeDevice(deps: WipeDeviceDeps): Promise<WipeResult> {
  const pendientes = sinEnviar(await deps.contar());
  if (pendientes > 0) return { kind: 'pendiente', sinEnviar: pendientes };
  await deps.tokenStore.clear();
  await wipeLocalData(deps.db);
  await deps.appConfig.set(
    APP_CONFIG_KEYS.avisoBorrado,
    (deps.now?.() ?? new Date()).toISOString(),
  );
  useAppConfigStore.getState().setUserId(null);
  await deps.queryClient.resetQueries();
  deps.reiniciar?.();
  return { kind: 'borrado' };
}
