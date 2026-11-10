/**
 * A release build with an unusable configuration (audit F-15d) does not try
 * to link: activation answers with its own error, in the screen's existing
 * error line, and no request leaves the phone.
 */

import type { ReactNode } from 'react';
import { act } from 'react';
import { afterEach, describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import {
  DEFAULT_ACTIVATION_CONFIG,
  type ActivationConfig,
} from '../../src/activation/activation-config';
import { ActivationProvider } from '../../src/activation/activation-context';
import { resolveRuntimeConfig } from '../../src/activation/release-config';
import { useActivate } from '../../src/activation/use-activate';
import { i18n, initI18n } from '../../src/i18n/index';

initI18n();

afterEach(() => vi.restoreAllMocks());

/** What the shell builds in a release bundle whose environment is `env`. */
function releaseConfig(env: { apiBase?: string; key?: string }): ActivationConfig {
  const runtime = resolveRuntimeConfig({
    isDev: false,
    apiBase: env.apiBase,
    entitlementPublicKeyHex: env.key,
    devApiBase: 'http://127.0.0.1:3000',
  });
  return {
    ...DEFAULT_ACTIVATION_CONFIG,
    apiBase: runtime.apiBase,
    entitlementPublicKeyHex: runtime.entitlementPublicKeyHex,
    configProblems: runtime.problems,
  };
}

function mount(config: ActivationConfig) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MockRepositoryProvider>
        <ActivationProvider config={config}>{children}</ActivationProvider>
      </MockRepositoryProvider>
    </QueryClientProvider>
  );
  return renderHook(() => useActivate(), { wrapper });
}

describe('useActivate in a release build with an unusable configuration', () => {
  it('refuses with the configuration error and sends nothing', async () => {
    const fetched = vi.spyOn(globalThis, 'fetch');
    const hook = mount(releaseConfig({}));
    act(() => hook.result.current.mutate({ email: 'dueno@negocio.mx', code: 'K7M3P9RW' }));
    await waitFor(() => assert.notEqual(hook.result.current.error, null));
    assert.equal(hook.result.current.error?.key, 'activate.errors.config');
    assert.match(hook.result.current.error?.message ?? '', /API_BASE_MISSING, PUBKEY_MALFORMED/);
    assert.equal(fetched.mock.calls.length, 0);
  });

  it('says so in Spanish, with no dash and no promise of a retry', () => {
    const text = i18n.t('activate.errors.config');
    assert.match(text, /versión/);
    assert.equal(text.includes('—'), false);
    assert.notEqual(text, i18n.t('activate.errors.network'));
  });

  it('tries the server as before when the configuration stands', async () => {
    const fetched = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new TypeError('Network request failed'));
    const key = '3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c';
    const hook = mount(releaseConfig({ apiBase: 'https://app.xangarro.mx', key }));
    act(() => hook.result.current.mutate({ email: 'dueno@negocio.mx', code: 'K7M3P9RW' }));
    await waitFor(() => assert.notEqual(hook.result.current.error, null));
    assert.equal(hook.result.current.error?.key, 'activate.errors.network');
    assert.equal(fetched.mock.calls.length, 1);
    assert.match(String(fetched.mock.calls[0]?.[0]), /^https:\/\/app\.xangarro\.mx\//);
  });
});
