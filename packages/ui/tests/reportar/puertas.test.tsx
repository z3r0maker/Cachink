import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import * as RN from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@xangarro/testing/ui';

import { initI18n } from '../../src/i18n/index';
import { useReportar } from '../../src/reportar/reportar-store';
import { AppShell, TurnoRows } from '../../src/screens/index';
import { SettingsDeviceSection } from '../../src/screens/Settings/settings-device-section';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

/**
 * The doors to the report sheet (M-23, ADR-162 §1; boards RpPuerta, RpAjustes,
 * RpTableta): a help button in the header on every tab, the row «¿Algo no
 * funciona?» in Mi turno, and «Reportar un problema» as a row in Ajustes.
 * Each opens the one sheet. No floating button anywhere.
 */
initI18n();

const noop = (): void => {};

function Providers({ children }: { children: ReactElement }): ReactElement {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return (
    <QueryClientProvider client={qc}>
      <MockRepositoryProvider>{children}</MockRepositoryProvider>
    </QueryClientProvider>
  );
}

function shell(over: Partial<Parameters<typeof AppShell>[0]> = {}) {
  return renderWithProviders(
    <Providers>
      <AppShell activeTabKey="/cobrar" onNavigate={noop} mode="local" {...over}>
        <span>hola</span>
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

beforeEach(() => useReportar.getState().cerrar());
afterEach(() => vi.restoreAllMocks());

describe('the help button in the header', () => {
  it('is on every tab, and opens the report sheet', () => {
    for (const tab of ['/inicio', '/cobrar', '/ventas', '/turno']) {
      const view = shell({ activeTabKey: tab });
      const boton = screen.getByTestId('ayuda-reportar');
      expect(boton).toHaveAttribute('aria-label', 'Ayuda: reportar un problema');
      view.unmount();
    }
    shell();
    expect(useReportar.getState().abierto).toBe(false);
    fireEvent.click(screen.getByTestId('ayuda-reportar'));
    expect(useReportar.getState()).toMatchObject({ abierto: true, eventId: null });
  });

  it('steps aside on a detail screen, where the header carries the way back', () => {
    shell({ onBack: noop, title: 'Mi turno' });
    expect(screen.queryByTestId('ayuda-reportar')).not.toBeInTheDocument();
  });

  it('is not shown where the header shows no status at all', () => {
    shell({ headerStatus: 'none' });
    expect(screen.queryByTestId('ayuda-reportar')).not.toBeInTheDocument();
  });

  it('says «Ayuda» beside its mark on the tablet, and only its mark on the phone', () => {
    setWidth(390);
    const phone = shell();
    expect(screen.getByTestId('ayuda-reportar')).not.toHaveTextContent('Ayuda');
    phone.unmount();
    setWidth(1024);
    shell();
    expect(screen.getByTestId('ayuda-reportar')).toHaveTextContent('Ayuda');
  });
});

describe('«¿Algo no funciona?» in Mi turno', () => {
  it('sits before Ajustes and opens the sheet instead of a route', () => {
    const onNavigate = vi.fn();
    const onReportar = vi.fn();
    renderWithProviders(<TurnoRows onNavigate={onNavigate} onReportar={onReportar} />);
    const filas = Array.from(screen.getByTestId('turno-rows').querySelectorAll('[data-testid]'))
      .map((el) => el.getAttribute('data-testid'))
      .filter((id) => id?.startsWith('otros-'));
    expect(filas.slice(-2)).toEqual(['otros-reportar', 'otros-configuracion']);
    expect(screen.getByTestId('otros-reportar')).toHaveTextContent('¿Algo no funciona?');
    expect(screen.getByTestId('otros-reportar')).toHaveTextContent(
      'Cuéntanos qué pasó, sin escribir',
    );
    fireEvent.click(screen.getByTestId('otros-reportar'));
    expect(onReportar).toHaveBeenCalledTimes(1);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('says how many reports wait on the device', () => {
    const view = renderWithProviders(
      <TurnoRows onNavigate={noop} onReportar={noop} reportesPorEnviar={1} />,
    );
    expect(screen.getByTestId('otros-reportar')).toHaveTextContent('1 reporte por enviar');
    view.unmount();
    renderWithProviders(<TurnoRows onNavigate={noop} onReportar={noop} reportesPorEnviar={3} />);
    expect(screen.getByTestId('otros-reportar')).toHaveTextContent('3 reportes por enviar');
  });

  it('is absent where nothing opens the sheet (the web caja)', () => {
    renderWithProviders(<TurnoRows onNavigate={noop} />);
    expect(screen.queryByTestId('otros-reportar')).not.toBeInTheDocument();
  });
});

describe('«Reportar un problema» in Ajustes', () => {
  it('is a row with its line under «Ayuda», and opens the sheet', () => {
    const onReportProblem = vi.fn();
    renderWithProviders(
      <SettingsDeviceSection
        device={{
          notificationsEnabled: true,
          onNotificationsChange: noop,
          crashReportingEnabled: false,
          onCrashReportingChange: noop,
          onReportProblem,
        }}
      />,
    );
    const fila = screen.getByTestId('settings-open-bug-report');
    expect(fila).toHaveTextContent('Reportar un problema');
    expect(fila).toHaveTextContent('Cuéntanos qué pasó, sin escribir');
    expect(screen.getByTestId('settings-ayuda')).toHaveAttribute('aria-label', 'Ayuda');
    fireEvent.click(fila);
    expect(onReportProblem).toHaveBeenCalledTimes(1);
  });
});
