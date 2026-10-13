/**
 * The states family (M-09, MvEstados): cargando, sin-nada, falla,
 * sin-internet — each with its own way forward, the words overridable so
 * every screen keeps its voice, and nothing guessed on top of real data.
 */
import { describe, expect, it, vi } from 'vitest';
import { initI18n } from '../src/i18n/index';
import { EstadosCaja } from '../src/screens/Pendientes/estados';
import { fireEvent, renderWithProviders, screen } from './test-utils';

initI18n();

describe('EstadosCaja · las cuatro', () => {
  it('cargando: busy and silent, no data below it', () => {
    renderWithProviders(<EstadosCaja id="cargando" testID="pantalla" />);
    expect(screen.getByTestId('pantalla-cargando')).toBeInTheDocument();
    expect(screen.getByTestId('pantalla-cargando').getAttribute('aria-busy')).toBe('true');
  });

  it('sin-nada: the default words, or the screen’s own', () => {
    const { unmount } = renderWithProviders(<EstadosCaja id="sin-nada" testID="pantalla" />);
    expect(screen.getByTestId('pantalla-sin-nada').textContent).toContain('Nada por aquí todavía');
    unmount();
    renderWithProviders(
      <EstadosCaja id="sin-nada" titulo="Sin avisos" cuerpo="Ni mensajes ni avisos." testID="p" />,
    );
    expect(screen.getByTestId('p-sin-nada').textContent).toContain('Sin avisos');
    expect(screen.getByTestId('p-sin-nada').textContent).toContain('Ni mensajes ni avisos.');
  });

  it('falla: the retry is the caller’s', () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <EstadosCaja id="falla" titulo="No se pudo leer" onRetry={onRetry} testID="p" />,
    );
    expect(screen.getByTestId('p-error').textContent).toContain('No se pudo leer');
    expect(screen.getByTestId('p-error').textContent).toContain('sigue guardado en esta caja');
    fireEvent.click(screen.getByTestId('error-state-retry'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('sin-internet: says to keep selling, and the way back', () => {
    const onRetry = vi.fn();
    renderWithProviders(<EstadosCaja id="sin-internet" onRetry={onRetry} testID="p" />);
    expect(screen.getByTestId('p-sin-internet').textContent).toContain('Sin internet');
    expect(screen.getByTestId('p-sin-internet').textContent).toContain('Puedes seguir cobrando');
    fireEvent.click(screen.getByTestId('p-reintentar'));
    expect(onRetry).toHaveBeenCalled();
  });
});
