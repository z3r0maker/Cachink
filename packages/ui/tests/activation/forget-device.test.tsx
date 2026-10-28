/**
 * forgetDevice — drop this device's identity but keep its data (A-07, A-12).
 * The unlink must not read as «the operator locked the caja»: the sign-out
 * subscription records every signed-in → signed-out transition as a lock,
 * so an unlinked device would come back to Bloqueo for a person who no
 * longer belongs to it instead of Vincular (M-11).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { forgetDevice } from '../../src/activation/forget-device';
import { useCajaLock } from '../../src/app/caja-lock';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import type { AppConfigRepository } from '@xangarro/data';
import type { DeviceTokenStore } from '../../src/activation/activation-config';

const appConfig = {
  delete: vi.fn(async () => undefined),
} as unknown as AppConfigRepository;
const tokenStore = { clear: vi.fn(async () => undefined) } as unknown as DeviceTokenStore;
const queryClient = new QueryClient();

describe('forgetDevice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCajaLock.getState().soltar();
    useAppConfigStore.setState({ userId: '01JPRS00000000000000000001' });
  });

  it('clears the token and the activation record and signs out', async () => {
    await forgetDevice({ appConfig, tokenStore, queryClient });
    expect(tokenStore.clear).toHaveBeenCalled();
    expect(appConfig.delete).toHaveBeenCalled();
    expect(useAppConfigStore.getState().userId).toBeNull();
  });

  it('releases the caja lock: unlinking is not locking', async () => {
    useCajaLock.setState({ bloqueadaPor: '01JPRS00000000000000000001' });
    await forgetDevice({ appConfig, tokenStore, queryClient });
    expect(useCajaLock.getState().bloqueadaPor).toBeNull();
  });
});
