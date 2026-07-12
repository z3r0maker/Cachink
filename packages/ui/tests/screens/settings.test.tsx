/**
 * Settings screen tests — Ajustes main screen.
 *
 * Covers mode card, business card, language card, funciones card,
 * edit business modal trigger, and all sub-components.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import type { Business } from '@cachink/domain';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Settings } from '../../src/screens/Settings/settings';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const BUSINESS = {
  nombre: 'Mi Tienda',
  regimenFiscal: 'RESICO',
  isrTasa: 125,
  enabledPaymentMethods: '["Efectivo","Transferencia"]',
} as unknown as Business;

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0, staleTime: Infinity } } });
  return (
    <QueryClientProvider client={qc}>
      <MockRepositoryProvider>{children}</MockRepositoryProvider>
    </QueryClientProvider>
  );
}

function renderSettings(overrides: Partial<Parameters<typeof Settings>[0]> = {}) {
  return renderWithProviders(
    <Wrapper>
      <Settings
        mode="local"
        business={BUSINESS}
        onReRunWizard={vi.fn()}
        showExportAction={false}
        showNotificationsToggle={false}
        {...overrides}
      />
    </Wrapper>,
  );
}

describe('Settings', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders with default testID settings-screen', () => {
    renderSettings();
    expect(screen.getByTestId('settings-screen')).toBeInTheDocument();
  });

  it('renders the mode card', () => {
    renderSettings();
    expect(screen.getByTestId('settings-mode-card')).toBeInTheDocument();
  });

  it('renders the business card with nombre', () => {
    renderSettings();
    expect(screen.getByTestId('settings-business-card')).toBeInTheDocument();
    expect(screen.getByText('Mi Tienda')).toBeInTheDocument();
  });

  it('renders the ISR rate in business card', () => {
    renderSettings();
    expect(screen.getByText('1.25%')).toBeInTheDocument();
  });

  it('renders the regimen fiscal in business card', () => {
    renderSettings();
    const matches = screen.getAllByText('RESICO');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders edit business button', () => {
    renderSettings();
    expect(screen.getByTestId('settings-edit-business')).toBeInTheDocument();
  });

  it('renders language card', () => {
    renderSettings();
    expect(screen.getByTestId('settings-language-card')).toBeInTheDocument();
  });

  it('renders funciones card when onOpenFunciones is provided', () => {
    renderSettings({ onOpenFunciones: vi.fn() });
    expect(screen.getByTestId('settings-funciones')).toBeInTheDocument();
  });

  it('does not render funciones card when onOpenFunciones is omitted', () => {
    renderSettings();
    expect(screen.queryByTestId('settings-funciones')).toBeNull();
  });

  it('fires onOpenFunciones when funciones card is tapped', () => {
    const onOpenFunciones = vi.fn();
    renderSettings({ onOpenFunciones });
    fireEvent.click(screen.getByTestId('settings-funciones'));
    expect(onOpenFunciones).toHaveBeenCalled();
  });

  it('handles null business gracefully', () => {
    renderSettings({ business: null });
    expect(screen.getByTestId('settings-business-card')).toBeInTheDocument();
  });

  it('renders with custom testID', () => {
    renderSettings({ testID: 'my-settings' });
    expect(screen.getByTestId('my-settings')).toBeInTheDocument();
  });

  it('renders with lan mode', () => {
    renderSettings({ mode: 'lan-server' });
    expect(screen.getByTestId('settings-screen')).toBeInTheDocument();
  });

  it('renders with cloud mode', () => {
    renderSettings({ mode: 'cloud' });
    expect(screen.getByTestId('settings-screen')).toBeInTheDocument();
  });
});
