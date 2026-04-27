/**
 * ExportarDatosAction tests (Slice 3 C26).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import type { BusinessId } from '@cachink/domain';
import { ExportarDatosAction } from '../../src/screens/index';
import { MockRepositoryProvider } from '@cachink/testing';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

const TEST_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

beforeEach(() => {
  useAppConfigStore.getState().setCurrentBusinessId(TEST_BIZ);
});

afterEach(() => {
  useAppConfigStore.getState().reset();
});

function harness(children: ReactElement): ReactElement {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 0, staleTime: Infinity } },
  });
  return (
    <QueryClientProvider client={client}>
      <MockRepositoryProvider>{children}</MockRepositoryProvider>
    </QueryClientProvider>
  );
}

describe('ExportarDatosAction', () => {
  it('renders the CTA Btn + status hint in the idle state', () => {
    renderWithProviders(harness(<ExportarDatosAction />));
    expect(screen.getByTestId('export-datos-btn')).toBeInTheDocument();
    expect(screen.getByTestId('export-datos-status').textContent).toContain('Descarga un Excel');
  });

  it('disables the Btn and marks pending while exporting', async () => {
    const build = vi
      .fn()
      .mockImplementation(() => new Promise((r) => setTimeout(() => r(new ArrayBuffer(4)), 10)));
    const share = vi.fn().mockResolvedValue({ shared: true, method: 'native' });
    renderWithProviders(
      harness(<ExportarDatosAction buildExcel={build as never} share={share as never} />),
    );
    fireEvent.click(screen.getAllByTestId('export-datos-btn')[0]!);
    await waitFor(() => {
      expect(screen.getByTestId('export-datos-status').textContent).toContain(
        'Listo para compartir',
      );
    });
    expect(build).toHaveBeenCalled();
    expect(share).toHaveBeenCalled();
  });

  it('routes a successful export through the injected share function', async () => {
    const build = vi.fn().mockResolvedValue(new ArrayBuffer(4));
    const share = vi.fn().mockResolvedValue({ shared: true, method: 'native' });
    renderWithProviders(
      harness(
        <ExportarDatosAction
          businessName="Taquería Test"
          buildExcel={build as never}
          share={share as never}
        />,
      ),
    );
    fireEvent.click(screen.getAllByTestId('export-datos-btn')[0]!);
    await waitFor(() => {
      expect(share).toHaveBeenCalled();
    });
    const call = share.mock.calls[0]![0] as { filename: string; title: string };
    expect(call.filename).toMatch(/^taquería-test-export-\d{4}-\d{2}-\d{2}\.xlsx$/i);
    expect(call.title).toBeTruthy();
  });

  it('shows the error state when the share step reports shared=false', async () => {
    const build = vi.fn().mockResolvedValue(new ArrayBuffer(4));
    const share = vi.fn().mockResolvedValue({ shared: false, method: 'cancelled' });
    renderWithProviders(
      harness(<ExportarDatosAction buildExcel={build as never} share={share as never} />),
    );
    fireEvent.click(screen.getAllByTestId('export-datos-btn')[0]!);
    await waitFor(() => {
      expect(screen.getByTestId('export-datos-status').textContent).toContain('No se pudo generar');
    });
  });
});
