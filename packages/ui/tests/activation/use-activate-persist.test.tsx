/**
 * «Conectar esta caja» never fails without a word (X-05). The server said
 * yes, then saving the link on the phone threw (on Android, a SQLite handle
 * closed under the app): the button came back with no error line, because
 * the screen reads `error.key` and only `ActivationError` carries one.
 */

import type { ReactNode } from 'react';
import { act } from 'react';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MOCK_CODES, startMockServer, type RunningMock } from '@xangarro/contracts/mock';
import { InMemoryReferenceDataRepository } from '@xangarro/testing';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import {
  DEFAULT_ACTIVATION_CONFIG,
  memoryTokenStore,
} from '../../src/activation/activation-config';
import { ActivationProvider } from '../../src/activation/activation-context';
import { ActivationError, useActivate } from '../../src/activation/use-activate';
import { initI18n } from '../../src/i18n/index';

initI18n();

// A fresh mock per test: the valid code is single-use.
let mock: RunningMock;
beforeEach(async () => {
  mock = await startMockServer(0);
});
afterEach(async () => {
  vi.restoreAllMocks();
  await mock.close();
});

const OWNER = { email: 'dueno@tacoslaesquina.mx', code: MOCK_CODES.valid };

/** A reference-data repository whose bootstrap write throws `error`. */
function failingBootstrap(error: unknown): InMemoryReferenceDataRepository {
  const repo = new InMemoryReferenceDataRepository();
  vi.spyOn(repo, 'applyBootstrap').mockRejectedValue(error);
  return repo;
}

function mount(referenceData?: InMemoryReferenceDataRepository) {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const config = {
    ...DEFAULT_ACTIVATION_CONFIG,
    apiBase: mock.url,
    tokenStore: memoryTokenStore(),
  };
  const overrides = referenceData ? { referenceData } : undefined;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MockRepositoryProvider overrides={overrides}>
        <ActivationProvider config={config}>{children}</ActivationProvider>
      </MockRepositoryProvider>
    </QueryClientProvider>
  );
  return renderHook(() => useActivate(), { wrapper });
}

async function failureOf(hook: ReturnType<typeof mount>): Promise<ActivationError> {
  act(() => hook.result.current.mutate(OWNER));
  await waitFor(() => assert.notEqual(hook.result.current.error, null));
  const error = hook.result.current.error;
  assert.ok(error instanceof ActivationError);
  return error;
}

describe('useActivate when the phone cannot save the link', () => {
  it('a native rejection on the bootstrap write reaches the screen as «Algo salió mal»', async () => {
    const npe = new Error(
      "Call to function 'NativeDatabase.prepareSync' has been rejected.\n→ Caused by: java.lang.NullPointerException",
    );
    const error = await failureOf(mount(failingBootstrap(npe)));
    assert.equal(error.key, 'activate.errors.unknown');
    assert.match(error.message, /NullPointerException/);
  });

  it('a thrown non-Error still carries a key and a message', async () => {
    const error = await failureOf(mount(failingBootstrap('disk full')));
    assert.equal(error.key, 'activate.errors.unknown');
    assert.equal(error.message, 'disk full');
  });

  it('logs what failed, so the bug report has it', async () => {
    const hook = mount(failingBootstrap(new Error('SQLITE_READONLY')));
    await failureOf(hook);
    const logged = vi.mocked(console.error).mock.calls.flat().map(String).join(' ');
    assert.match(logged, /SQLITE_READONLY/);
  });

  it('a server refusal keeps its own key', async () => {
    const hook = mount();
    act(() => hook.result.current.mutate({ ...OWNER, code: MOCK_CODES.expired }));
    await waitFor(() => assert.notEqual(hook.result.current.error, null));
    assert.equal(hook.result.current.error?.key, 'activate.errors.codeExpired');
  });

  it('links the phone when nothing fails', async () => {
    const hook = mount();
    act(() => hook.result.current.mutate(OWNER));
    await waitFor(() => assert.equal(hook.result.current.isSuccess, true));
    assert.equal(hook.result.current.error, null);
  });
});
