/**
 * AppShell + Settings component tests.
 *
 * Single role (ADR-053): one 4-tab bar, operator avatar locks the screen.
 */

import { describe, expect, it, vi } from 'vitest';
import type { BusinessId } from '@xangarro/domain';
import type { Business } from '@xangarro/domain';
import { DEFAULT_FEATURE_FLAGS } from '@xangarro/domain';
import { AppShell, Settings, appTabs } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const noop = (): void => {};
const defaultFlags = DEFAULT_FEATURE_FLAGS;

describe('appTabs', () => {
  // Single role (ADR-053) and no "Otros" slot (ADR-052): always 4 tabs.
  it('returns the v1 bar without flags: Ventas, Caja, Gastos, Productos', () => {
    expect(appTabs().map((tab) => tab.key)).toEqual(['ventas', 'caja', 'gastos', 'productos']);
  });

  it('swaps the 4th tab to merma when the flag is on', () => {
    const tabs = appTabs({ ...defaultFlags, merma: true });
    expect(tabs).toHaveLength(4);
    expect(tabs[3]!.key).toBe('merma');
  });

  it('keeps productos when merma is off', () => {
    expect(appTabs({ ...defaultFlags, merma: false })[3]!.key).toBe('productos');
  });

  it('never exposes the retired Director tabs', () => {
    const keys = appTabs({ ...defaultFlags, merma: true }).map((tab) => tab.key);
    for (const retired of ['home', 'estados', 'otros']) expect(keys).not.toContain(retired);
  });
});

describe('AppShell', () => {
  function mount(overrides?: {
    onNavigate?: (p: string) => void;
    onSwitchOperator?: () => void;
    onOpenSettings?: () => void;
  }) {
    return renderWithProviders(
      <AppShell
        activeTabKey="ventas"
        onNavigate={overrides?.onNavigate ?? noop}
        onSwitchOperator={overrides?.onSwitchOperator ?? noop}
        onOpenSettings={overrides?.onOpenSettings ?? noop}
        mode="local"
        title="Ventas"
        subtitle="jueves, 24 abril"
        flags={defaultFlags}
      >
        <span data-testid="shell-body">hello</span>
      </AppShell>,
    );
  }

  it('renders the 4 tabs (Ventas, Caja, Gastos, Productos) and no Director tabs', () => {
    mount();
    for (const key of ['ventas', 'caja', 'gastos', 'productos']) {
      expect(screen.getByTestId(`tab-${key}`)).toBeInTheDocument();
    }
    for (const key of ['otros', 'home', 'estados']) {
      expect(screen.queryByTestId(`tab-${key}`)).toBeNull();
    }
  });

  it("fires onNavigate with the tapped tab's path", () => {
    const onNavigate = vi.fn();
    mount({ onNavigate });
    fireEvent.click(screen.getByTestId('tab-gastos'));
    expect(onNavigate).toHaveBeenCalledWith('/egresos');
  });

  it('fires onSwitchOperator when the avatar is tapped', () => {
    const onSwitchOperator = vi.fn();
    mount({ onSwitchOperator });
    fireEvent.click(screen.getAllByTestId('top-bar-role-chip')[0]!);
    expect(onSwitchOperator).toHaveBeenCalledTimes(1);
  });

  it('fires onOpenSettings when the settings cog is tapped', () => {
    const onOpenSettings = vi.fn();
    mount({ onOpenSettings });
    fireEvent.click(screen.getAllByTestId('top-bar-open-settings')[0]!);
    expect(onOpenSettings).toHaveBeenCalled();
  });

  it('renders the operator avatar with an illustration', () => {
    mount();
    const chip = screen.getByTestId('top-bar-role-chip');
    expect(chip.getAttribute('aria-label')).toBe('Cambiar');
    expect(screen.getByTestId('role-illustration')).toBeInTheDocument();
  });

  it('renders no sync badge in local mode', () => {
    mount();
    expect(screen.queryByTestId('sync-status-badge')).toBeNull();
  });

  it('renders the back button instead of the avatar when onBack is set', () => {
    const onBack = vi.fn();
    renderWithProviders(
      <AppShell
        activeTabKey="ventas"
        onNavigate={noop}
        onSwitchOperator={noop}
        onOpenSettings={noop}
        onBack={onBack}
        mode="local"
        title="Ajustes"
        flags={defaultFlags}
      >
        <span />
      </AppShell>,
    );
    expect(screen.queryByTestId('top-bar-role-chip')).toBeNull();
    fireEvent.click(screen.getByTestId('top-bar-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('Settings', () => {
  const business: Business = {
    id: '01JPHK00000000000000000008' as BusinessId,
    nombre: 'Taquería Don Pedro',
    regimenFiscal: 'RIF',
    isrTasa: 3000,
    logoUrl: null,
    featureFlags: JSON.stringify(defaultFlags),
    businessId: '01JPHK00000000000000000008' as BusinessId,
    deviceId: 'dev' as Business['deviceId'],
    createdByUserId: null,
    createdAt: '2026-04-24T00:00:00Z' as Business['createdAt'],
    updatedAt: '2026-04-24T00:00:00Z' as Business['updatedAt'],
    deletedAt: null,
  };

  function wrapSettings(ui: React.ReactElement) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
    return (
      <QueryClientProvider client={qc}>
        <MockRepositoryProvider>{ui}</MockRepositoryProvider>
      </QueryClientProvider>
    );
  }

  it('renders the business nombre, regimen fiscal and ISR', () => {
    renderWithProviders(
      wrapSettings(
        <Settings mode="local" business={business} onReRunWizard={noop} showExportAction={false} />,
      ),
    );
    expect(screen.getByText('Taquería Don Pedro')).toBeInTheDocument();
    expect(screen.getAllByText('RIF').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('30%').length).toBeGreaterThanOrEqual(1);
  });

  it('renders a placeholder when no business', () => {
    renderWithProviders(
      wrapSettings(
        <Settings mode="local" business={null} onReRunWizard={noop} showExportAction={false} />,
      ),
    );
    expect(screen.getByText('Sin configurar')).toBeInTheDocument();
  });

  it('fires onReRunWizard when tapped', () => {
    const onReRunWizard = vi.fn();
    renderWithProviders(
      wrapSettings(
        <Settings
          mode="local"
          business={business}
          onReRunWizard={onReRunWizard}
          showExportAction={false}
        />,
      ),
    );
    const button = screen.getAllByTestId('settings-re-run-wizard')[0]!;
    fireEvent.click(button);
    expect(onReRunWizard).toHaveBeenCalled();
  });

  it('renders the localized mode label for local mode', () => {
    renderWithProviders(
      wrapSettings(
        <Settings mode="local" business={business} onReRunWizard={noop} showExportAction={false} />,
      ),
    );
    expect(screen.getByText('Solo en este dispositivo')).toBeInTheDocument();
  });
});
