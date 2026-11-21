/**
 * «¿Es tu negocio?» (N-25): the preview hook hands the sheet the business a
 * token names, or the activation error copy for the redeem's refusals and for
 * no network; a release build that could never link asks nothing. And how
 * a link's token is handed over.
 */

import type { ReactNode } from 'react';
import { act } from 'react';
import { afterEach, describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  DEFAULT_ACTIVATION_CONFIG,
  type ActivationConfig,
} from '../../src/activation/activation-config';
import { ActivationProvider } from '../../src/activation/activation-context';
import { useActivatePreview, vistaPreviaDe } from '../../src/activation/use-activate-preview';
import { enlaceDe } from '../../src/activation/use-enlace-vinculacion';
import { ActivationError } from '../../src/activation/use-activate';
import { initI18n } from '../../src/i18n/index';

initI18n();
afterEach(() => vi.restoreAllMocks());

const TOKEN = 'mockqrVALDK7M3xangarro';
const NEGOCIO = {
  businessName: 'Taquería Don Pedro',
  ownerFirstName: 'Pedro',
  ownerEmail: 'pedro@taqueriadonpedro.mx',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function mount(config: ActivationConfig = DEFAULT_ACTIVATION_CONFIG) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <ActivationProvider config={config}>{children}</ActivationProvider>
    </QueryClientProvider>
  );
  return renderHook(() => useActivatePreview(), { wrapper });
}

describe('useActivatePreview', () => {
  it('waits, then names the business; posts the token in the body, never the URL', async () => {
    const fetched = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, NEGOCIO));
    const hook = mount();
    assert.deepEqual(hook.result.current.vista, { estado: 'cargando' });
    act(() => hook.result.current.leer(TOKEN));
    await waitFor(() => assert.equal(hook.result.current.vista.estado, 'listo'));
    assert.deepEqual(hook.result.current.vista, { estado: 'listo', negocio: NEGOCIO });
    const [url, init] = fetched.mock.calls[0] ?? [];
    assert.match(String(url), /\/api\/v1\/activate\/preview$/);
    assert.equal(String(url).includes(TOKEN), false);
    assert.equal(JSON.parse(String(init?.body)).qrToken, TOKEN);
  });

  it('shows a used token in the redeem’s copy, and forgets it on the way back', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json(409, { error: { code: 'CODE_USED', message: 'CODE_USED' } }),
    );
    const hook = mount();
    act(() => hook.result.current.leer(TOKEN));
    await waitFor(() => assert.equal(hook.result.current.vista.estado, 'error'));
    assert.deepEqual(hook.result.current.vista, {
      estado: 'error',
      errorKey: 'activate.errors.codeUsed',
    });
    act(() => hook.result.current.soltar());
    await waitFor(() => assert.deepEqual(hook.result.current.vista, { estado: 'cargando' }));
  });

  it('says there is no network when the request never lands', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
    const hook = mount();
    act(() => hook.result.current.leer(TOKEN));
    await waitFor(() => assert.equal(hook.result.current.vista.estado, 'error'));
    assert.deepEqual(hook.result.current.vista, {
      estado: 'error',
      errorKey: 'activate.errors.network',
    });
  });

  it('asks nothing from a release build that could never link', async () => {
    const fetched = vi.spyOn(globalThis, 'fetch');
    const config: ActivationConfig = {
      ...DEFAULT_ACTIVATION_CONFIG,
      configProblems: [{ code: 'API_BASE_MISSING', field: 'apiBase', message: 'not set' }],
    };
    const hook = mount(config);
    act(() => hook.result.current.leer(TOKEN));
    await waitFor(() => assert.equal(hook.result.current.vista.estado, 'error'));
    assert.deepEqual(hook.result.current.vista, {
      estado: 'error',
      errorKey: 'activate.errors.config',
    });
    assert.equal(fetched.mock.calls.length, 0);
  });
});

describe('vistaPreviaDe', () => {
  it('an error wins over stale data', () => {
    const error = new ActivationError('activate.errors.codeExpired', 'x');
    assert.deepEqual(vistaPreviaDe({ data: NEGOCIO, error }), {
      estado: 'error',
      errorKey: 'activate.errors.codeExpired',
    });
  });
});

describe('enlaceDe', () => {
  it('hands over the launch link once, and a link opened while running every time', () => {
    const estado = { inicialEntregado: false };
    const url = `xangarro://activar#c=${TOKEN}`;
    assert.deepEqual(enlaceDe(url, true, estado), { token: TOKEN });
    assert.equal(enlaceDe(url, true, estado), null);
    const otra = enlaceDe(url, false, estado);
    assert.deepEqual(otra, { token: TOKEN });
    assert.notEqual(enlaceDe(url, false, estado), otra, 'each read is its own object');
  });

  it('ignores no link, and a link that carries no pairing token', () => {
    const estado = { inicialEntregado: false };
    assert.equal(enlaceDe(null, true, estado), null);
    assert.equal(enlaceDe('xangarro://avisos', false, estado), null);
    assert.equal(enlaceDe('xangarro://activar#c=corto', true, estado), null);
    assert.equal(estado.inicialEntregado, false, 'a launch link that was not ours spends nothing');
  });
});
