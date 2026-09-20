/**
 * forgetDevice — drop this device's identity but keep its data (A-07, A-12).
 *
 * Used when the server revokes the device and when the operator taps
 * "Desvincular este dispositivo". Clears the secure token and the activation
 * record, signs the operator out, and lets the activation gate take over.
 * Sales, turnos and everything else stay in SQLite; unsent rows push after
 * the next activation.
 */

import type { QueryClient } from '@tanstack/react-query';
import type { AppConfigRepository } from '@xangarro/data';
import { APP_CONFIG_KEYS } from '../app-config/types';
import { useAppConfigStore } from '../app-config/use-app-config';
import type { DeviceTokenStore } from './activation-config';
import { ACTIVATION_QUERY_KEY } from './use-activation-state';

export async function forgetDevice(deps: {
  readonly appConfig: AppConfigRepository;
  readonly tokenStore: DeviceTokenStore;
  readonly queryClient: QueryClient;
}): Promise<void> {
  await deps.tokenStore.clear();
  await deps.appConfig.delete(APP_CONFIG_KEYS.activation);
  useAppConfigStore.getState().setUserId(null);
  await deps.queryClient.invalidateQueries({ queryKey: ACTIVATION_QUERY_KEY });
}
