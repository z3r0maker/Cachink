/**
 * The «Listo, se borraron los datos» notice (MvDesvincularBorrar): shown
 * after a wipe until the phone is linked again, however often the connect
 * screen mounts (once before the restart, once after).
 */

import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { InMemoryAppConfigRepository } from '@xangarro/testing';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { useAvisoBorrado } from '../../src/activation/use-aviso-borrado';
import { ActivationScreen } from '../../src/screens/Activation/index';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

function wrapper(appConfig: InMemoryAppConfigRepository) {
  return ({ children }: { children: ReactNode }) => (
    <MockRepositoryProvider overrides={{ appConfig }}>{children}</MockRepositoryProvider>
  );
}

describe('useAvisoBorrado', () => {
  it('says so after a wipe, and keeps the flag for the next mount', async () => {
    const appConfig = new InMemoryAppConfigRepository();
    await appConfig.set('avisoBorrado', '2026-11-03T18:00:00.000Z');
    const first = renderHook(() => useAvisoBorrado(), { wrapper: wrapper(appConfig) });
    await waitFor(() => expect(first.result.current).toBe(true));
    first.unmount();
    const second = renderHook(() => useAvisoBorrado(), { wrapper: wrapper(appConfig) });
    await waitFor(() => expect(second.result.current).toBe(true));
  });

  it('stays quiet on an ordinary launch', async () => {
    const appConfig = new InMemoryAppConfigRepository();
    const { result } = renderHook(() => useAvisoBorrado(), { wrapper: wrapper(appConfig) });
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current).toBe(false);
  });
});

describe('ActivationScreen after a wipe', () => {
  const props = { onSubmit: () => undefined, onScan: () => undefined, submitting: false };

  it('opens the scan view with the green «Listo»', () => {
    renderWithProviders(<ActivationScreen {...props} borrado />);
    expect(screen.getByTestId('vincular-borrado')).toHaveTextContent(
      'Listo, se borraron los datos',
    );
  });

  it('shows nothing of the kind otherwise', () => {
    renderWithProviders(<ActivationScreen {...props} />);
    expect(screen.queryByTestId('vincular-borrado')).toBeNull();
  });
});
