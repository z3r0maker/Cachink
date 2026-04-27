/**
 * InformeMensualAction tests (Slice 3 C27).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import type { BusinessId } from '@cachink/domain';
import { InformeMensualAction } from '../../src/screens/index';
import { MockRepositoryProvider } from '@cachink/testing';
import { useBusinessesRepository } from '../../src/app/repository-provider';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';
import { InMemoryBusinessesRepository } from '@cachink/testing';

initI18n();

let TEST_BIZ: BusinessId | null = null;
const seedBusinesses = new InMemoryBusinessesRepository();

beforeEach(async () => {
  const biz = await seedBusinesses.create({
    nombre: 'Test',
    regimenFiscal: 'RESICO',
    isrTasa: 0.3,
  });
  TEST_BIZ = biz.id as BusinessId;
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
      <MockRepositoryProvider overrides={{ businesses: seedBusinesses }}>
        {children}
      </MockRepositoryProvider>
    </QueryClientProvider>
  );
}

// Silence unused lint on the helper import.
void useBusinessesRepository;

describe('InformeMensualAction', () => {
  it('renders the CTA Btn with the default "Share" status', () => {
    renderWithProviders(harness(<InformeMensualAction yearMonth="2026-04" />));
    expect(screen.getByTestId('informe-mensual-btn')).toBeInTheDocument();
  });

  it('routes a successful fetch through the injected PDF builder + share', async () => {
    const buildPdf = vi.fn().mockResolvedValue(new Blob(['%PDF-1.7']));
    const share = vi.fn().mockResolvedValue({ shared: true, method: 'native' });
    renderWithProviders(
      harness(
        <InformeMensualAction
          yearMonth="2026-04"
          businessName="Taquería Test"
          buildPdf={buildPdf as never}
          share={share as never}
        />,
      ),
    );
    fireEvent.click(screen.getAllByTestId('informe-mensual-btn')[0]!);
    await waitFor(() => {
      expect(buildPdf).toHaveBeenCalled();
      expect(share).toHaveBeenCalled();
    });
    const call = share.mock.calls[0]![0] as { filename: string };
    expect(call.filename).toMatch(/informe-2026-04\.pdf$/);
  });

  it('shows the pending label while in-flight', async () => {
    let resolveBuild: ((v: Blob) => void) | undefined;
    const buildPdf = vi.fn().mockImplementation(
      () =>
        new Promise<Blob>((r) => {
          resolveBuild = r;
        }),
    );
    const share = vi.fn().mockResolvedValue({ shared: true, method: 'native' });
    renderWithProviders(
      harness(
        <InformeMensualAction
          yearMonth="2026-04"
          buildPdf={buildPdf as never}
          share={share as never}
        />,
      ),
    );
    fireEvent.click(screen.getAllByTestId('informe-mensual-btn')[0]!);
    await waitFor(() => {
      expect(screen.getByTestId('informe-mensual-status').textContent).toContain('Generando');
    });
    resolveBuild?.(new Blob(['%PDF-1.7']));
    await waitFor(() => {
      expect(screen.getByTestId('informe-mensual-status').textContent).toContain('Listo');
    });
  });
});
