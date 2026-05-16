/**
 * AppShell + Settings component tests.
 *
 * Updated for Phase 4: 5-tab bottom bar with Otros grid pattern.
 */

import { describe, expect, it, vi } from 'vitest';
import type { BusinessId } from '@cachink/domain';
import type { Business } from '@cachink/domain';
import { DEFAULT_FEATURE_FLAGS } from '@cachink/domain';
import {
  AppShell,
  OPERATIVO_TABS,
  DIRECTOR_TABS,
  Settings,
  tabsForRole,
} from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const noop = (): void => {};
const defaultFlags = DEFAULT_FEATURE_FLAGS;

describe('tabsForRole', () => {
  it('returns 5-tab Operativo set (without flags)', () => {
    expect(tabsForRole('operativo')).toStrictEqual(OPERATIVO_TABS);
    expect(tabsForRole('operativo')).toHaveLength(5);
  });

  it('returns the 4-tab Director set', () => {
    expect(tabsForRole('director')).toBe(DIRECTOR_TABS);
    expect(tabsForRole('director')).toHaveLength(4);
  });

  it('Operativo with merma ON: 4th tab is merma', () => {
    const tabs = tabsForRole('operativo', {
      ...defaultFlags,
      merma: true,
    });
    expect(tabs).toHaveLength(5);
    expect(tabs[3]!.key).toBe('merma');
    expect(tabs[4]!.key).toBe('otros');
  });

  it('Operativo with merma OFF: 4th tab is productos', () => {
    const tabs = tabsForRole('operativo', {
      ...defaultFlags,
      merma: false,
    });
    expect(tabs[3]!.key).toBe('productos');
  });
});

describe('AppShell — Operativo', () => {
  function mountOperativo(overrides?: {
    onNavigate?: (p: string) => void;
    onChangeRole?: () => void;
    onOpenSettings?: () => void;
  }) {
    return renderWithProviders(
      <AppShell
        role="operativo"
        activeTabKey="ventas"
        onNavigate={overrides?.onNavigate ?? noop}
        onChangeRole={overrides?.onChangeRole ?? noop}
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

  it('renders the 4 Operativo tabs (Ventas, Gastos, Productos, Otros)', () => {
    mountOperativo();
    expect(screen.getByTestId('tab-ventas')).toBeInTheDocument();
    expect(screen.getByTestId('tab-gastos')).toBeInTheDocument();
    expect(screen.getByTestId('tab-productos')).toBeInTheDocument();
    expect(screen.getByTestId('tab-otros')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-home')).toBeNull();
    expect(screen.queryByTestId('tab-estados')).toBeNull();
  });

  it("fires onNavigate with the tapped tab's path", () => {
    const onNavigate = vi.fn();
    mountOperativo({ onNavigate });
    fireEvent.click(screen.getByTestId('tab-gastos'));
    expect(onNavigate).toHaveBeenCalledWith('/egresos');
  });

  it('fires onChangeRole when the role avatar is tapped', () => {
    const onChangeRole = vi.fn();
    mountOperativo({ onChangeRole });
    const avatar = screen.getAllByTestId('top-bar-role-chip')[0]!;
    fireEvent.click(avatar);
    expect(onChangeRole).toHaveBeenCalled();
  });

  it('fires onOpenSettings when the settings cog is tapped', () => {
    const onOpenSettings = vi.fn();
    mountOperativo({ onOpenSettings });
    const button = screen.getAllByTestId('top-bar-open-settings')[0]!;
    fireEvent.click(button);
    expect(onOpenSettings).toHaveBeenCalled();
  });

  it('renders the role avatar with an illustration', () => {
    mountOperativo();
    const chip = screen.getByTestId('top-bar-role-chip');
    expect(chip.getAttribute('aria-label')).toBe('Cambiar');
    expect(screen.getByTestId('role-illustration')).toBeInTheDocument();
    expect(screen.queryByTestId('initials-avatar-text')).toBeNull();
  });

  it('renders no sync badge in local mode', () => {
    mountOperativo();
    expect(screen.queryByTestId('sync-status-badge')).toBeNull();
  });

  it('renders back button when onBack is set', () => {
    const onBack = vi.fn();
    renderWithProviders(
      <AppShell
        role="operativo"
        activeTabKey="ventas"
        onNavigate={noop}
        onChangeRole={noop}
        onOpenSettings={noop}
        onBack={onBack}
        mode="local"
        title="Ajustes"
        flags={defaultFlags}
      >
        <span />
      </AppShell>,
    );
    expect(screen.getByTestId('top-bar-back')).toBeInTheDocument();
    expect(screen.queryByTestId('top-bar-role-chip')).toBeNull();
    fireEvent.click(screen.getByTestId('top-bar-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('AppShell — Director', () => {
  it('renders all 4 Director tabs', () => {
    renderWithProviders(
      <AppShell
        role="director"
        activeTabKey="home"
        onNavigate={noop}
        onChangeRole={noop}
        onOpenSettings={noop}
        mode="local"
        flags={defaultFlags}
      >
        <span />
      </AppShell>,
    );
    for (const key of ['home', 'ventas', 'estados', 'otros']) {
      expect(screen.getByTestId(`tab-${key}`)).toBeInTheDocument();
    }
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
