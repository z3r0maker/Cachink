/**
 * IndicadoresScreen tests — updated for themed sections + health + help.
 */

import { describe, expect, it, vi } from 'vitest';
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

  it('formats liquidez with × suffix and rotación with veces/mes suffix', () => {
    renderWithProviders(
      <IndicadoresScreen
        indicadores={indicadores({ razonDeLiquidez: 1.856, rotacionInventario: 3.999 })}
        periodoLabel="Abril 2026"
        periodoMode="mensual"
      />,
    );
    expect(screen.getByTestId('indicador-liquidez').textContent).toContain('1.86×');
    expect(screen.getByTestId('indicador-rotacion').textContent).toContain('4.00 veces/mes');
  });

  it('rounds días promedio de cobranza to an integer with días suffix', () => {
    renderWithProviders(
      <IndicadoresScreen
        indicadores={indicadores({ diasPromedioCobranza: 12.6 })}
        periodoLabel="Abril 2026"
      />,
    );
    expect(screen.getByTestId('indicador-dias-cobranza').textContent).toContain('13 días');
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

  // ── New: themed sections ──

  it('renders the two themed section titles', () => {
    renderWithProviders(
      <IndicadoresScreen indicadores={indicadores()} periodoLabel="Abril 2026" />,
    );
    expect(screen.getByText('¿Qué tan rentable es tu negocio?')).toBeInTheDocument();
    expect(screen.getByText('¿Qué tan sano opera tu negocio?')).toBeInTheDocument();
  });

  it('renders section subtitles', () => {
    renderWithProviders(
      <IndicadoresScreen indicadores={indicadores()} periodoLabel="Abril 2026" />,
    );
    expect(
      screen.getByText('Qué porcentaje de cada peso de venta se queda como ganancia.'),
    ).toBeInTheDocument();
  });

  // ── New: help accordions ──

  it('renders HelpAccordion subtitles for margins', () => {
    renderWithProviders(
      <IndicadoresScreen indicadores={indicadores()} periodoLabel="Abril 2026" />,
    );
    expect(
      screen.getByText('De cada peso vendido, ¿cuánto te queda después del costo?'),
    ).toBeInTheDocument();
  });

  // ── New: threshold disclosure card ──

  it('renders the threshold disclosure card', () => {
    renderWithProviders(
      <IndicadoresScreen indicadores={indicadores()} periodoLabel="Abril 2026" />,
    );
    expect(screen.getByTestId('indicadores-threshold-disclosure')).toBeInTheDocument();
    expect(
      screen.getByText('Estos indicadores usan rangos generales para pequeños negocios.'),
    ).toBeInTheDocument();
  });

  it('renders "Configurar en Ajustes" link when onOpenSettings provided', () => {
    const onOpenSettings = vi.fn();
    renderWithProviders(
      <IndicadoresScreen
        indicadores={indicadores()}
        periodoLabel="Abril 2026"
        onOpenSettings={onOpenSettings}
      />,
    );
    expect(screen.getByTestId('indicadores-settings-link')).toBeInTheDocument();
  });

  // ── New: gauge zones ──

  it('renders gauge zones on margin cards', () => {
    renderWithProviders(
      <IndicadoresScreen indicadores={indicadores()} periodoLabel="Abril 2026" />,
    );
    // Zone segments are rendered inside the gauge track
    const zones = screen.queryAllByTestId('gauge-zone');
    expect(zones.length).toBeGreaterThan(0);
  });

  // ── Fix 3: gauge cap for deeply negative margins ──

  it('caps deeply negative margin at "< -100%" instead of showing -404%', () => {
    renderWithProviders(
      <IndicadoresScreen
        indicadores={indicadores({ margenBruto: -4.04 })}
        periodoLabel="Abril 2026"
      />,
    );
    const card = screen.getByTestId('indicador-margen-bruto');
    expect(card.textContent).toContain('< -100%');
    expect(card.textContent).not.toContain('-404%');
  });

  it('always renders gauge zones regardless of negative margin values', () => {
    renderWithProviders(
      <IndicadoresScreen
        indicadores={indicadores({ margenBruto: -0.5, margenOperativo: -0.3, margenNeto: -0.2 })}
        periodoLabel="Abril 2026"
      />,
    );
    // 3 margin gauges × 3 colored zones each = 9 zone segments always rendered
    const zones = screen.queryAllByTestId('gauge-zone');
    expect(zones.length).toBe(9);
  });

  // ── Fix 4: rotación anual suffix ──

  it('shows veces/año suffix when periodoMode is anual', () => {
    renderWithProviders(
      <IndicadoresScreen
        indicadores={indicadores({ rotacionInventario: 2.08 })}
        periodoLabel="2025"
        periodoMode="anual"
      />,
    );
    expect(screen.getByTestId('indicador-rotacion').textContent).toContain('2.08 veces/año');
  });

  it('shows veces en el periodo suffix when periodoMode is rango', () => {
    renderWithProviders(
      <IndicadoresScreen
        indicadores={indicadores({ rotacionInventario: 2.08 })}
        periodoLabel="Ene 2026 – Mar 2026"
        periodoMode="rango"
      />,
    );
    expect(screen.getByTestId('indicador-rotacion').textContent).toContain('2.08 veces en el periodo');
  });
});
