/**
 * AppShell + Settings component tests (P1C-M1-T02/T03/T04).
 */

import { describe, expect, it, vi } from 'vitest';
import type { BusinessId } from '@cachink/domain';
import type { Business } from '@cachink/domain';
import {
  AppShell,
  OPERATIVO_TABS,
  DIRECTOR_TABS,
  Settings,
  tabsForRole,
} from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const noop = (): void => {};

describe('tabsForRole', () => {
  it('returns the 3-tab Operativo set', () => {
    expect(tabsForRole('operativo')).toBe(OPERATIVO_TABS);
    expect(tabsForRole('operativo')).toHaveLength(3);
  });

  it('returns the 6-tab Director set', () => {
    expect(tabsForRole('director')).toBe(DIRECTOR_TABS);
    expect(tabsForRole('director')).toHaveLength(6);
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
      >
        <span data-testid="shell-body">hello</span>
      </AppShell>,
    );
  }

  it('renders only the 3 Operativo tabs', () => {
    mountOperativo();
    expect(screen.getByTestId('tab-ventas')).toBeInTheDocument();
    expect(screen.getByTestId('tab-egresos')).toBeInTheDocument();
    expect(screen.getByTestId('tab-productos')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-home')).toBeNull();
    expect(screen.queryByTestId('tab-estados')).toBeNull();
    expect(screen.queryByTestId('tab-ajustes')).toBeNull();
  });

  it("fires onNavigate with the tapped tab's path", () => {
    const onNavigate = vi.fn();
    mountOperativo({ onNavigate });
    fireEvent.click(screen.getByTestId('tab-egresos'));
    expect(onNavigate).toHaveBeenCalledWith('/egresos');
  });

  it('fires onChangeRole when the role avatar is tapped (replaces Cambiar btn)', () => {
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

  it('renders the role avatar with the role-derived initials', () => {
    mountOperativo();
    const chip = screen.getByTestId('top-bar-role-chip');
    // Default avatarValue falls back to the role label → 'Operativo' → 'OP'.
    expect(chip.getAttribute('aria-label')).toBe('Cambiar');
    const text = screen.getAllByTestId('initials-avatar-text')[0]!;
    expect(text.textContent).toBe('OP');
  });

  it('uses the explicit avatarValue when supplied', () => {
    renderWithProviders(
      <AppShell
        role="operativo"
        activeTabKey="ventas"
        onNavigate={noop}
        onChangeRole={noop}
        onOpenSettings={noop}
        mode="local"
        avatarValue="Panadería La Esquina"
      >
        <span />
      </AppShell>,
    );
    const text = screen.getAllByTestId('initials-avatar-text')[0]!;
    // "Panadería La Esquina" → 3 tokens → first char of each = "PLE".
    expect(text.textContent).toBe('PLE');
  });

  it('renders no sync badge in local mode', () => {
    mountOperativo();
    expect(screen.queryByTestId('sync-status-badge')).toBeNull();
  });

  // UI-AUDIT-1 Issue 2 — when `onBack` is provided the TopBar's left
  // slot renders a back button instead of the role avatar.
  it('renders the back button (and hides the role avatar) when onBack is set', () => {
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
      >
        <span />
      </AppShell>,
    );
    expect(screen.getByTestId('top-bar-back')).toBeInTheDocument();
    expect(screen.queryByTestId('top-bar-role-chip')).toBeNull();
    fireEvent.click(screen.getByTestId('top-bar-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('uses the localised default back-label aria when backLabel is omitted', () => {
    renderWithProviders(
      <AppShell
        role="operativo"
        activeTabKey="ventas"
        onNavigate={noop}
        onChangeRole={noop}
        onOpenSettings={noop}
        onBack={noop}
        mode="local"
      >
        <span />
      </AppShell>,
    );
    const back = screen.getByTestId('top-bar-back');
    // es-MX → topBar.back = 'Atrás'.
    expect(back.getAttribute('aria-label')).toBe('Atrás');
  });

  it('honours an explicit backLabel override', () => {
    renderWithProviders(
      <AppShell
        role="operativo"
        activeTabKey="ventas"
        onNavigate={noop}
        onChangeRole={noop}
        onOpenSettings={noop}
        onBack={noop}
        backLabel="Volver a Inicio"
        mode="local"
      >
        <span />
      </AppShell>,
    );
    expect(screen.getByTestId('top-bar-back').getAttribute('aria-label')).toBe(
      'Volver a Inicio',
    );
  });
});

describe('AppShell — Director', () => {
  it('renders all 6 Director tabs', () => {
    renderWithProviders(
      <AppShell
        role="director"
        activeTabKey="home"
        onNavigate={noop}
        onChangeRole={noop}
        onOpenSettings={noop}
        mode="local"
      >
        <span />
      </AppShell>,
    );
    for (const key of ['home', 'ventas', 'egresos', 'productos', 'estados', 'ajustes']) {
      expect(screen.getByTestId(`tab-${key}`)).toBeInTheDocument();
    }
  });

  it('renders the sync badge in LAN mode', () => {
    renderWithProviders(
      <AppShell
        role="director"
        activeTabKey="home"
        onNavigate={noop}
        onChangeRole={noop}
        onOpenSettings={noop}
        mode="lan"
      >
        <span />
      </AppShell>,
    );
    expect(screen.getByTestId('sync-status-badge')).toBeInTheDocument();
  });
});

describe('Settings', () => {
  const business: Business = {
    id: '01JPHK00000000000000000008' as BusinessId,
    nombre: 'Taquería Don Pedro',
    regimenFiscal: 'RIF',
    isrTasa: 0.3,
    logoUrl: null,
    businessId: '01JPHK00000000000000000008' as BusinessId,
    deviceId: 'dev' as Business['deviceId'],
    createdAt: '2026-04-24T00:00:00Z' as Business['createdAt'],
    updatedAt: '2026-04-24T00:00:00Z' as Business['updatedAt'],
    deletedAt: null,
  };

  it('renders the business nombre, regimen fiscal and ISR percentage', () => {
    renderWithProviders(
      <Settings mode="local" business={business} onReRunWizard={noop} showExportAction={false} />,
    );
    expect(screen.getByText('Taquería Don Pedro')).toBeInTheDocument();
    expect(screen.getByText('RIF')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('renders a placeholder when no business is configured', () => {
    renderWithProviders(
      <Settings mode="local" business={null} onReRunWizard={noop} showExportAction={false} />,
    );
    expect(screen.getByText('Sin configurar')).toBeInTheDocument();
  });

  it('fires onReRunWizard when the button is tapped', () => {
    const onReRunWizard = vi.fn();
    renderWithProviders(
      <Settings
        mode="local"
        business={business}
        onReRunWizard={onReRunWizard}
        showExportAction={false}
      />,
    );
    const button = screen.getAllByTestId('settings-re-run-wizard')[0]!;
    fireEvent.click(button);
    expect(onReRunWizard).toHaveBeenCalled();
  });

  it('renders the localized mode label for local mode', () => {
    renderWithProviders(
      <Settings mode="local" business={business} onReRunWizard={noop} showExportAction={false} />,
    );
    expect(screen.getByText('Solo en este dispositivo')).toBeInTheDocument();
  });
});
