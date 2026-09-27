/**
 * El Mostrador surfaces (M-05): panels, toast, offline banner, lock shell,
 * the big nav rows and the path icon.
 */
import { describe, expect, it, vi } from 'vitest';
import { ICONS } from '@xangarro/caja';
import { BloqueoShell } from '../../src/components/Bloqueo/index';
import { NavRows } from '../../src/components/NavRows/index';
import { OfflineBanner } from '../../src/components/OfflineBanner/index';
import { HeroPanel, QuietPanel } from '../../src/components/Panel/index';
import { PathIcon } from '../../src/components/PathIcon/index';
import { Toast } from '../../src/components/Toast/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('QuietPanel and HeroPanel', () => {
  it('the quiet panel is white with the gray edge and no shadow', () => {
    renderWithProviders(
      <QuietPanel label="Ventas del turno" count={12}>
        <span>fila</span>
      </QuietPanel>,
    );
    const panel = screen.getByTestId('quiet-panel');
    expect(panel.getAttribute('aria-label')).toBe('Ventas del turno');
    expect(getComputedStyle(panel).borderTopColor).toBe('rgb(228, 228, 224)');
    expect(getComputedStyle(panel).boxShadow).toBe('');
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('the hero is yellow with the thick black edge and the hero shadow', () => {
    renderWithProviders(
      <HeroPanel label="Efectivo que debe haber">
        <span>$2,710.00</span>
      </HeroPanel>,
    );
    const hero = screen.getByTestId('hero-panel');
    expect(getComputedStyle(hero).backgroundColor).toBe('rgb(255, 214, 10)');
    expect(getComputedStyle(hero).borderTopWidth).toBe('2.5px');
    expect(getComputedStyle(hero).boxShadow).toContain('5px 5px 0');
  });
});

describe('Toast', () => {
  it('is a status with its title, body and a labelled 44 px close', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Toast title="Venta cobrada" body="Se guardó en esta caja." onClose={onClose} />,
    );
    expect(screen.getByTestId('toast').getAttribute('role')).toBe('status');
    expect(screen.getByText('Se guardó en esta caja.')).toBeInTheDocument();
    const close = screen.getByTestId('toast-close');
    expect(close.getAttribute('aria-label')).toBe('Cerrar aviso: Venta cobrada');
    expect(getComputedStyle(close).height).toBe('44px');
    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('floats above the tab bar when asked', () => {
    renderWithProviders(<Toast title="Listo" onClose={vi.fn()} floating />);
    expect(getComputedStyle(screen.getByTestId('toast')).bottom).toBe('76px');
  });
});

describe('OfflineBanner', () => {
  it('says what happens in words, with the count when known', () => {
    renderWithProviders(<OfflineBanner pendientes={3} />);
    const banner = screen.getByTestId('offline-banner');
    expect(banner.getAttribute('role')).toBe('status');
    expect(banner).toHaveTextContent('Sin internet');
    expect(banner).toHaveTextContent('3 por enviar');
  });

  it('keeps the plain message without a count', () => {
    renderWithProviders(<OfflineBanner />);
    expect(screen.getByTestId('offline-banner')).toHaveTextContent('Todo se guarda en esta caja');
  });
});

describe('BloqueoShell', () => {
  it('shows the session context, the title, the operator and the unlock slot', () => {
    renderWithProviders(
      <BloqueoShell
        contexto="Caja del mostrador · Tacos El Güero"
        operador={{
          nombre: 'Luisa Pérez',
          iniciales: 'LP',
          detalle: 'Turno abierto desde las 09:00',
        }}
      >
        <span>nip</span>
      </BloqueoShell>,
    );
    expect(screen.getByText('Caja del mostrador · Tacos El Güero')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent('Caja bloqueada');
    expect(screen.getByText('LP')).toBeInTheDocument();
    expect(screen.getByText('nip')).toBeInTheDocument();
  });
});

describe('NavRows', () => {
  it('renders one labelled 68 px button per row and fires its onPress', () => {
    const onPress = vi.fn();
    renderWithProviders(
      <NavRows
        label="Lo de tu turno"
        items={[
          {
            key: 'gastos',
            title: 'Gastos',
            detail: 'Lo que sale de la caja',
            icon: ICONS.gastos,
            tint: '#FFE8EA',
            chip: { label: '1 vence hoy', tone: 'red' },
            onPress,
          },
        ]}
      />,
    );
    const row = screen.getByTestId('nav-row-gastos');
    expect(row.getAttribute('role')).toBe('button');
    expect(row.getAttribute('aria-label')).toBe('Gastos. Lo que sale de la caja. 1 vence hoy');
    expect(getComputedStyle(row).minHeight).toBe('68px');
    fireEvent.click(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('PathIcon', () => {
  it('draws the caja glyph it is given, hidden from screen readers', () => {
    renderWithProviders(<PathIcon d={ICONS.caja} />);
    const svg = screen.getByTestId('svg-mock-Svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByTestId('svg-mock-Path').getAttribute('d')).toBe(ICONS.caja);
  });
});
