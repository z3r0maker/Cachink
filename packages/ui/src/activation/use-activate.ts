/**
 * useActivate — redeems email + code, then makes the device usable offline:
 * token → secure storage, the bootstrap's first page and pull cursor →
 * SQLite in one transaction, activation record, entitlement and server time
 * → app_config (A-04; the paged snapshot bootstrap, C-23).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ActivateResponse } from '@xangarro/contracts';
import type { AppConfigRepository } from '@xangarro/data';
import { AVISO_VINCULACION_VERSION, type BusinessId } from '@xangarro/domain';
import type { ReferenceDataRepository } from '@xangarro/sync';
import { APP_CONFIG_KEYS, useSetCurrentBusinessId, useSetMode } from '../app-config/index';
import { useAppConfigRepository, useReferenceDataRepository } from '../app/repository-provider';
import { useActivationContext } from './activation-context';
import type { ActivationConfig, ActivationRecord, DeviceTokenStore } from './activation-config';
import { activationErrorKey, type ActivationErrorKey } from './activation-errors';
import { ACTIVATION_QUERY_KEY } from './use-activation-state';

/** The typed path (the owner's correo and the code) or the scan path (C-14). */
export type ActivateInput =
  | { readonly email: string; readonly code: string }
  | { readonly qrToken: string };

export class ActivationError extends Error {
  readonly key: ActivationErrorKey;
  constructor(key: ActivationErrorKey, message: string) {
    super(message);
    this.name = 'ActivationError';
    this.key = key;
  }
}

/**
 * A release build with no usable API base or public key (audit F-15d) does
 * not try: there is no mock to fall back to and no plan it could verify.
 */
function refuseUnusableConfig(config: ActivationConfig): void {
  const problems = config.configProblems ?? [];
  if (problems.length === 0) return;
  const codes = problems.map((p) => p.code).join(', ');
  throw new ActivationError('activate.errors.config', `Release configuration: ${codes}`);
}

/**
 * Any failure the server did not name still reaches the screen's error line:
 * a native SQLite rejection while saving the link (X-05) left «Conectar esta
 * caja» enabled again with no word, because the screen reads `error.key`.
 */
export function asActivationError(error: unknown): ActivationError {
  if (error instanceof ActivationError) return error;
  console.error('[useActivate] activation failed:', error);
  const message = error instanceof Error ? error.message : String(error);
  return new ActivationError('activate.errors.unknown', message);
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
  // The first page and the pull cursor together (C-23): a whale's remaining
  // snapshot pages follow on the engine's first sync, which activation starts.
  await deps.referenceData.applyBootstrap(data.bootstrap, data.businessId);
  const record: ActivationRecord = {
    deviceId: data.deviceId,
    businessId: data.businessId,
    activatedAt: data.bootstrap.serverTime,
  };
  const c = deps.appConfig;
  await c.set(APP_CONFIG_KEYS.entitlement, JSON.stringify(data.entitlement));
  await c.set(APP_CONFIG_KEYS.lastServerTime, data.bootstrap.serverTime);
  await c.set(APP_CONFIG_KEYS.currentBusinessId, data.businessId);
  await c.set(APP_CONFIG_KEYS.mode, 'local');
  await c.set(APP_CONFIG_KEYS.discoveryShown, 'true');
  // A wiped phone said «Listo» until it was linked again (wipe-device.ts).
  await c.delete(APP_CONFIG_KEYS.avisoBorrado);
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
      try {
        refuseUnusableConfig(config);
        // N-34: the aviso this screen showed goes with the request.
        const res = await client.activate({
          ...input,
          device: config.deviceInfo,
          avisoVersion: AVISO_VINCULACION_VERSION,
          bootstrap: 'snapshot',
        });
        if (!res.ok) throw new ActivationError(activationErrorKey(res.code), res.message);
        const deps = { referenceData, appConfig, tokenStore: config.tokenStore };
        return await persistActivation(deps, res.data);
      } catch (error: unknown) {
        throw asActivationError(error);
      }
    },
    async onSuccess(record) {
      setMode('local');
      setBusinessId(record.businessId as BusinessId);
      await queryClient.invalidateQueries({ queryKey: ['appConfig'] });
      await queryClient.invalidateQueries({ queryKey: ACTIVATION_QUERY_KEY });
    },
  });
}
