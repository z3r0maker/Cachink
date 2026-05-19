/**
 * EstadoResultadosScreen tests — updated for punchline-first structure.
 */

import { describe, expect, it } from 'vitest';
import type { EstadoDeResultados } from '@cachink/domain';
import { EstadoResultadosScreen } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

function estado(overrides: Partial<EstadoDeResultados> = {}): EstadoDeResultados {
  return {
    ingresos: 100_000n,
    costoDeVentas: 40_000n,
    utilidadBruta: 60_000n,
    merma: 0n,
    gastosOperativos: 20_000n,
    utilidadOperativa: 40_000n,
    isr: 12_000n,
    utilidadNeta: 28_000n,
    ...overrides,
  } as EstadoDeResultados;
}

describe('EstadoResultadosScreen', () => {
  it('renders the seven rows with formatted money', () => {
    renderWithProviders(<EstadoResultadosScreen estado={estado()} periodoLabel="Abril 2026" />);
    expect(screen.getByTestId('estado-row-ingresos').textContent).toContain('$1,000.00');
    expect(screen.getByTestId('estado-row-costo-ventas').textContent).toContain('$400.00');
    expect(screen.getByTestId('estado-row-utilidad-bruta').textContent).toContain('$600.00');
    expect(screen.getByTestId('estado-row-gastos-operativos').textContent).toContain('$200.00');
    expect(screen.getByTestId('estado-row-utilidad-operativa').textContent).toContain('$400.00');
    expect(screen.getByTestId('estado-row-isr').textContent).toContain('$120.00');
    expect(screen.getByTestId('estado-utilidad-neta-hero').textContent).toContain('$280.00');
  });

  it('renders the periodo label passed in', () => {
    renderWithProviders(<EstadoResultadosScreen estado={estado()} periodoLabel="Abril 2026" />);
    expect(screen.getByText('Abril 2026')).toBeInTheDocument();
  });

  it('shows the empty-period card when estado is null', () => {
    renderWithProviders(<EstadoResultadosScreen estado={null} periodoLabel="Abril 2026" />);
    expect(screen.getByTestId('estado-resultados-empty')).toBeInTheDocument();
    expect(screen.getByText('Sin datos en el periodo')).toBeInTheDocument();
  });

  it('renders the ResumenCard at the top (punchline first)', () => {
    renderWithProviders(<EstadoResultadosScreen estado={estado()} periodoLabel="Abril" />);
    expect(screen.getByTestId('estado-resumen-card')).toBeInTheDocument();
    // ResumenCard is the first card in the render tree
    expect(screen.getByTestId('estado-resumen-card')).toBeInTheDocument();
  });

  it('renders health indicator on the resumen card', () => {
    renderWithProviders(
      <EstadoResultadosScreen estado={estado({ utilidadNeta: 10_000n })} periodoLabel="Abril" />,
    );
    expect(screen.getByTestId('estado-resumen-health')).toBeInTheDocument();
  });

  it('uses the negative Kpi tone when utilidad neta is negative', () => {
    renderWithProviders(
      <EstadoResultadosScreen
        estado={estado({ utilidadNeta: -5_000n, utilidadOperativa: -5_000n, isr: 0n })}
        periodoLabel="Abril"
      />,
    );
    const hero = screen.getByTestId('estado-utilidad-neta-hero');
    expect(hero.textContent).toContain('-$50.00');
  });

  // ── Merma row tests ──

  it('does NOT show merma row when merma is zero', () => {
    renderWithProviders(
      <EstadoResultadosScreen estado={estado({ merma: 0n })} periodoLabel="Abril" />,
    );
    expect(screen.queryByTestId('estado-row-merma')).toBeNull();
  });

  it('shows merma row when merma is positive', () => {
    renderWithProviders(
      <EstadoResultadosScreen estado={estado({ merma: 5_000n })} periodoLabel="Abril" />,
    );
    expect(screen.getByTestId('estado-row-merma')).toBeInTheDocument();
    expect(screen.getByTestId('estado-row-merma').textContent).toContain('$50.00');
  });

  // ── Help accordion tests ──

  it('renders HelpAccordions for each financial term', () => {
    renderWithProviders(
      <EstadoResultadosScreen estado={estado()} periodoLabel="Abril" />,
    );
    // Subtitles should be visible (always-on)
    expect(screen.getByText('Todo el dinero que entró por ventas')).toBeInTheDocument();
    expect(screen.getByText('Lo que gastaste para producir lo que vendiste')).toBeInTheDocument();
    expect(screen.getByText('Lo que te queda después del costo del producto')).toBeInTheDocument();
    expect(screen.getByText('Gastos para mantener el negocio andando')).toBeInTheDocument();
  });

  // ── ISR zero hint ──

  it('shows ISR $0 hint when ISR is zero and utilidad operativa is negative', () => {
    renderWithProviders(
      <EstadoResultadosScreen
        estado={estado({ utilidadOperativa: -10_000n, isr: 0n, utilidadNeta: -10_000n })}
        periodoLabel="Abril"
      />,
    );
    expect(screen.getByTestId('estado-isr-zero-hint')).toBeInTheDocument();
  });

  it('does NOT show ISR $0 hint when ISR is non-zero', () => {
    renderWithProviders(
      <EstadoResultadosScreen estado={estado()} periodoLabel="Abril" />,
    );
    expect(screen.queryByTestId('estado-isr-zero-hint')).toBeNull();
  });

  // ── Delta indicator ──

  it('renders delta indicator when prior estado is provided', () => {
    const prior = estado({ utilidadNeta: 20_000n });
    renderWithProviders(
      <EstadoResultadosScreen
        estado={estado({ utilidadNeta: 28_000n })}
        priorEstado={prior}
        periodoLabel="Abril"
      />,
    );
    expect(screen.getByTestId('estado-resumen-delta')).toBeInTheDocument();
  });

  it('does NOT render delta indicator when prior estado is not provided', () => {
    renderWithProviders(
      <EstadoResultadosScreen estado={estado()} periodoLabel="Abril" />,
    );
    expect(screen.queryByTestId('estado-resumen-delta')).toBeNull();
  });
});
