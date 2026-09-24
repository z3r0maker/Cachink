/**
 * useActivate — redeems email + code, then makes the device usable offline:
 * token → secure storage, bootstrap rows → SQLite, activation record,
 * entitlement, server time and pull cursor → app_config (A-04).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ActivateResponse } from '@xangarro/contracts';
import type { AppConfigRepository } from '@xangarro/data';
import { AVISO_VINCULACION_VERSION, type BusinessId } from '@xangarro/domain';
import type { ReferenceDataRepository } from '@xangarro/sync';
import { APP_CONFIG_KEYS, useSetCurrentBusinessId, useSetMode } from '../app-config/index';
import { useAppConfigRepository, useReferenceDataRepository } from '../app/repository-provider';
import { useActivationContext } from './activation-context';
import type { ActivationRecord, DeviceTokenStore } from './activation-config';
import { activationErrorKey, type ActivationErrorKey } from './activation-errors';
import { ACTIVATION_QUERY_KEY } from './use-activation-state';

export interface ActivateInput {
  readonly email: string;
  readonly code: string;
}

export class ActivationError extends Error {
  readonly key: ActivationErrorKey;
  constructor(key: ActivationErrorKey, message: string) {
    super(message);
    this.name = 'ActivationError';
    this.key = key;
  }
}

/** Everything the device needs to run offline after a successful activation. */
export async function persistActivation(
  deps: {
    referenceData: ReferenceDataRepository;
    appConfig: AppConfigRepository;
    tokenStore: DeviceTokenStore;
  },
  data: ActivateResponse,
): Promise<ActivationRecord> {
  await deps.tokenStore.set(data.deviceToken);
  await deps.referenceData.apply(data.bootstrap.tables, data.businessId);
  const record: ActivationRecord = {
    deviceId: data.deviceId,
    businessId: data.businessId,
    activatedAt: data.bootstrap.serverTime,
  };
  const c = deps.appConfig;
  await c.set(APP_CONFIG_KEYS.entitlement, JSON.stringify(data.entitlement));
  await c.set(APP_CONFIG_KEYS.lastServerTime, data.bootstrap.serverTime);
  await c.set(APP_CONFIG_KEYS.pullSeq, String(data.bootstrap.serverSeq));
  await c.set(APP_CONFIG_KEYS.currentBusinessId, data.businessId);
  await c.set(APP_CONFIG_KEYS.mode, 'local');
  await c.set(APP_CONFIG_KEYS.discoveryShown, 'true');
  // Written last: the gate opens only once everything above is in place.
  await c.set(APP_CONFIG_KEYS.activation, JSON.stringify(record));
  return record;
}

export function useActivate() {
  const { client, config } = useActivationContext();
  const referenceData = useReferenceDataRepository();
  const appConfig = useAppConfigRepository();
  const queryClient = useQueryClient();
  const setBusinessId = useSetCurrentBusinessId();
  const setMode = useSetMode();
  return useMutation<ActivationRecord, ActivationError, ActivateInput>({
    async mutationFn(input) {
      // N-34: the aviso this screen showed goes with the request.
      const res = await client.activate({
        ...input,
        device: config.deviceInfo,
        avisoVersion: AVISO_VINCULACION_VERSION,
      });
      if (!res.ok) throw new ActivationError(activationErrorKey(res.code), res.message);
      return persistActivation(
        { referenceData, appConfig, tokenStore: config.tokenStore },
        res.data,
      );
    },
    async onSuccess(record) {
      setMode('local');
      setBusinessId(record.businessId as BusinessId);
      await queryClient.invalidateQueries({ queryKey: ['appConfig'] });
      await queryClient.invalidateQueries({ queryKey: ACTIVATION_QUERY_KEY });
    },
  });
}
