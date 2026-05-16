/**
 * ConversionScreen tests — Phase 18.
 *
 * Verifies:
 *   - Renders with sub-tab toggle (Recetas / Historial).
 *   - Shows empty states when no data.
 *   - Shows "no products" empty state when no MP or venta products exist.
 */

import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import { renderWithProviders, screen } from '../test-utils';
import { initI18n } from '../../src/i18n/index';
import { ConversionScreen } from '../../src/screens/Conversion/conversion-screen';

initI18n();

function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={qc}>
      <MockRepositoryProvider>{children}</MockRepositoryProvider>
    </QueryClientProvider>
  );
}

describe('ConversionScreen', () => {
  it('renders the conversion screen with tab toggle', () => {
    renderWithProviders(
      <Wrapper>
        <ConversionScreen />
      </Wrapper>,
    );
    expect(screen.getByTestId('conversion-screen')).toBeTruthy();
    expect(screen.getByTestId('conversion-tab-toggle')).toBeTruthy();
  });

  it('shows no-products empty state when no MP or venta products', () => {
    renderWithProviders(
      <Wrapper>
        <ConversionScreen />
      </Wrapper>,
    );
    expect(screen.getByTestId('conversion-no-products')).toBeTruthy();
  });

  it('renders empty recetas state when no data is loaded', () => {
    renderWithProviders(
      <Wrapper>
        <ConversionScreen />
      </Wrapper>,
    );
    expect(screen.getByText('No hay recetas de conversión')).toBeTruthy();
  });
});
