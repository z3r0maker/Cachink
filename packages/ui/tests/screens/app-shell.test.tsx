/**
 * AppShell — the caja's frame (Track M, M-05). Single role (ADR-053).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import * as RN from 'react-native';
import {
  AppShell,
  appTabs,
  cajaLayoutFor,
  inicialesDe,
  navGroups,
  navKeyFor,
  tabKeyFor,
} from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const noop = (): void => {};

describe('the caja navigation model', () => {
  it('the phone has exactly four tabs: Inicio, Cobrar, Ventas, Mi turno', () => {
    expect(appTabs().map((tab) => tab.key)).toEqual(['inicio', 'cobrar', 'ventas', 'turno']);
  });

  it('the rail and the sidebar group the rest like the web sidebar', () => {
    expect(navGroups().map((g) => g.items.map((i) => i.key))).toEqual([
      ['inicio', 'cobrar'],
      ['ventas', 'gastos', 'cobranza'],
      ['turno', 'inventario'],
    ]);
  });

  it('lights a detail route under its destination', () => {
    expect(navKeyFor('/cobrar')).toBe('cobrar');
    expect(navKeyFor('/checkout/efectivo')).toBe('cobrar');
    expect(navKeyFor('/inventario')).toBe('inventario');
    expect(navKeyFor('/avisos')).toBe('inicio');
    expect(navKeyFor('/pendientes')).toBe('cobrar');
    expect(navKeyFor('/egresos')).toBe('gastos');
    expect(navKeyFor('/cobranza/c-1')).toBe('cobranza');
    expect(navKeyFor('/settings')).toBe('turno');
    expect(navKeyFor('/')).toBe('inicio');
  });

  it('on the phone, Gastos, Fiado y abonos and Inventario live under Mi turno', () => {
    expect(tabKeyFor('gastos')).toBe('turno');
    expect(tabKeyFor('cobranza')).toBe('turno');
    expect(tabKeyFor('inventario')).toBe('turno');
    expect(tabKeyFor('ventas')).toBe('ventas');
  });

  it('switches frame at 760 and 1280 px', () => {
    expect(cajaLayoutFor(390)).toBe('phone');
    expect(cajaLayoutFor(759)).toBe('phone');
    expect(cajaLayoutFor(760)).toBe('rail');
    expect(cajaLayoutFor(1279)).toBe('rail');
    expect(cajaLayoutFor(1280)).toBe('sidebar');
  });

  it('turns a name into its initials', () => {
    expect(inicialesDe('Ana Robledo')).toBe('AR');
    expect(inicialesDe('  María de la Luz Pérez ')).toBe('MP');
    expect(inicialesDe('Toni')).toBe('TO');
    expect(inicialesDe('')).toBe('');
  });
});

function Providers({ children }: { children: ReactElement }): ReactElement {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return (
    <QueryClientProvider client={qc}>
      <MockRepositoryProvider>{children}</MockRepositoryProvider>
    </QueryClientProvider>
  );
}

function mount(overrides?: Partial<Parameters<typeof AppShell>[0]>) {
  return renderWithProviders(
    <Providers>
      <AppShell activeTabKey="/cobrar" onNavigate={noop} mode="local" {...overrides}>
        <span data-testid="shell-body">hola</span>
      </AppShell>
    </Providers>,
  );
}

function setWidth(width: number): void {
  vi.spyOn(RN, 'useWindowDimensions').mockReturnValue({
    width,
    height: 900,
    scale: 2,
    fontScale: 1,
  });
}

afterEach(() => vi.restoreAllMocks());

describe('AppShell on a phone', () => {
  it('renders the four tabs, the current one selected, and no retired tab', () => {
    mount();
    for (const key of ['inicio', 'cobrar', 'ventas', 'turno']) {
      expect(screen.getByTestId(`tab-${key}`)).toBeInTheDocument();
    }
    for (const key of ['caja', 'gastos', 'productos', 'otros']) {
      expect(screen.queryByTestId(`tab-${key}`)).toBeNull();
    }
    expect(screen.getByTestId('tab-cobrar').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('shell-body')).toBeInTheDocument();
  });

  it("navigates to the tapped tab's path", () => {
    const onNavigate = vi.fn();
    mount({ onNavigate });
    fireEvent.click(screen.getByTestId('tab-turno'));
    expect(onNavigate).toHaveBeenCalledWith('/turno');
  });

  it('lights Mi turno on a route opened from it', () => {
    mount({ activeTabKey: '/egresos' });
    expect(screen.getByTestId('tab-turno').getAttribute('aria-selected')).toBe('true');
  });

  it('shows the caja badge and the sync pill in the 64 px header', () => {
    mount();
    const header = screen.getByTestId('app-header');
    expect(getComputedStyle(header).height).toBe('64px');
    expect(screen.getByTestId('caja-badge')).toBeInTheDocument();
    expect(screen.getByTestId('cloud-sync-pill')).toBeInTheDocument();
  });

  it('shows no bell without a count source, and the bell with one', () => {
    mount();
    expect(screen.queryByTestId('avisos-bell')).toBeNull();
    const onPress = vi.fn();
    mount({ avisos: { count: 2, onPress } });
    const bell = screen.getByTestId('avisos-bell');
    expect(bell.getAttribute('aria-label')).toBe('Avisos, 2 sin leer');
    fireEvent.click(bell);
    expect(onPress).toHaveBeenCalled();
  });

  it('swaps the caja badge for the way back on a detail route', () => {
    const onBack = vi.fn();
    mount({ onBack, title: 'Mi turno', activeTabKey: '/settings' });
    expect(screen.queryByTestId('caja-badge')).toBeNull();
    const back = screen.getByTestId('top-bar-back');
    expect(back).toHaveTextContent('Mi turno');
    fireEvent.click(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('never prints a hard-coded caja name', () => {
    mount();
    expect(screen.queryByText('Caja 1')).toBeNull();
  });
});

describe('AppShell on a tablet', () => {
  it('from 760 px shows the icon rail and the top bar instead of the tabs', () => {
    setWidth(1180);
    const onNavigate = vi.fn();
    const onLock = vi.fn();
    mount({ onNavigate, onLock });
    expect(screen.getByTestId('nav-rail')).toBeInTheDocument();
    expect(screen.queryByTestId('bottom-tab-bar')).toBeNull();
    expect(getComputedStyle(screen.getByTestId('app-header')).height).toBe('72px');
    expect(screen.getByTestId('rail-cobrar').getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByTestId('rail-gastos'));
    expect(onNavigate).toHaveBeenCalledWith('/egresos');
    fireEvent.click(screen.getByTestId('rail-bloquear'));
    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it('from 1280 px shows the full sidebar with its groups', () => {
    setWidth(1366);
    mount();
    expect(screen.getByTestId('nav-sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId('nav-rail')).toBeNull();
    expect(screen.getByText('Dinero del turno')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-inventario')).toBeInTheDocument();
  });
});
