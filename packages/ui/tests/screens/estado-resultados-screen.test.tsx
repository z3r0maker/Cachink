/**
 * EstadoResultadosScreen tests (Slice 3 C11).
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
    gastosOperativos: 20_000n,
    utilidadOperativa: 40_000n,
    isr: 12_000n,
    utilidadNeta: 28_000n,
    ...overrides,
  } as EstadoDeResultados;
}

describe('EstadoResultadosScreen', () => {
  it('renders the seven lines with formatted money', () => {
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

  it('uses the positive Kpi tone when utilidad neta ≥ 0', () => {
    renderWithProviders(
      <EstadoResultadosScreen estado={estado({ utilidadNeta: 10_000n })} periodoLabel="Abril" />,
    );
    const hero = screen.getByTestId('estado-utilidad-neta-hero');
    expect(hero).toBeInTheDocument();
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
});
