/**
 * IndicadoresScreen tests (Slice 3 C17).
 */

import { describe, expect, it } from 'vitest';
import type { Indicadores } from '@cachink/domain';
import { IndicadoresScreen } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

function indicadores(overrides: Partial<Indicadores> = {}): Indicadores {
  return {
    margenBruto: 0.6,
    margenOperativo: 0.4,
    margenNeto: 0.28,
    razonDeLiquidez: 1.8,
    rotacionInventario: 4.2,
    diasPromedioCobranza: 12,
    ...overrides,
  } as Indicadores;
}

describe('IndicadoresScreen', () => {
  it('renders all six KPI cards', () => {
    renderWithProviders(
      <IndicadoresScreen indicadores={indicadores()} periodoLabel="Abril 2026" />,
    );
    expect(screen.getByTestId('indicador-margen-bruto')).toBeInTheDocument();
    expect(screen.getByTestId('indicador-margen-operativo')).toBeInTheDocument();
    expect(screen.getByTestId('indicador-margen-neto')).toBeInTheDocument();
    expect(screen.getByTestId('indicador-liquidez')).toBeInTheDocument();
    expect(screen.getByTestId('indicador-rotacion')).toBeInTheDocument();
    expect(screen.getByTestId('indicador-dias-cobranza')).toBeInTheDocument();
  });

  it('formats margins as percent', () => {
    renderWithProviders(
      <IndicadoresScreen
        indicadores={indicadores({ margenBruto: 0.6 })}
        periodoLabel="Abril 2026"
      />,
    );
    expect(screen.getByTestId('indicador-margen-bruto').textContent).toContain('60%');
  });

  it('formats liquidez and rotación to 2 decimals', () => {
    renderWithProviders(
      <IndicadoresScreen
        indicadores={indicadores({ razonDeLiquidez: 1.856, rotacionInventario: 3.999 })}
        periodoLabel="Abril 2026"
      />,
    );
    expect(screen.getByTestId('indicador-liquidez').textContent).toContain('1.86');
    expect(screen.getByTestId('indicador-rotacion').textContent).toContain('4.00');
  });

  it('rounds días promedio de cobranza to an integer', () => {
    renderWithProviders(
      <IndicadoresScreen
        indicadores={indicadores({ diasPromedioCobranza: 12.6 })}
        periodoLabel="Abril 2026"
      />,
    );
    expect(screen.getByTestId('indicador-dias-cobranza').textContent).toContain('13');
  });

  it('renders "—" placeholder for every null KPI', () => {
    renderWithProviders(
      <IndicadoresScreen
        indicadores={{
          margenBruto: null,
          margenOperativo: null,
          margenNeto: null,
          razonDeLiquidez: null,
          rotacionInventario: null,
          diasPromedioCobranza: null,
        }}
        periodoLabel="Abril 2026"
      />,
    );
    expect(screen.getByTestId('indicador-liquidez').textContent).toContain('—');
    expect(screen.getByTestId('indicador-rotacion').textContent).toContain('—');
    expect(screen.getByTestId('indicador-dias-cobranza').textContent).toContain('—');
  });
});
