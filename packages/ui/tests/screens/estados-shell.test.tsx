/**
 * EstadosShell tests (Slice 3 C19).
 */

import { describe, expect, it, vi } from 'vitest';
import type {
  BalanceGeneral,
  EstadoDeResultados,
  FlujoDeEfectivo,
  Indicadores,
} from '@cachink/domain';
import { EstadosShell } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';
import { defaultPeriodoState } from '../../src/hooks/use-periodo-range';

initI18n();

function baseProps(overrides?: {
  estado?: EstadoDeResultados | null;
  balance?: BalanceGeneral | null;
  flujo?: FlujoDeEfectivo | null;
  indicadores?: Indicadores | null;
}): Parameters<typeof EstadosShell>[0] {
  return {
    periodoState: defaultPeriodoState(new Date('2026-04-24T12:00:00Z')),
    onPeriodoChange: vi.fn(),
    periodoLabel: 'Abril 2026',
    estado: overrides?.estado ?? null,
    balance: overrides?.balance ?? null,
    flujo: overrides?.flujo ?? null,
    indicadores: overrides?.indicadores ?? null,
  };
}

describe('EstadosShell', () => {
  it('renders the Resultados tab by default', () => {
    renderWithProviders(<EstadosShell {...baseProps()} />);
    expect(screen.getByTestId('estado-resultados-screen')).toBeInTheDocument();
  });

  it('switches to Balance when the balance tab is tapped', () => {
    renderWithProviders(<EstadosShell {...baseProps()} />);
    fireEvent.click(screen.getAllByTestId('estados-tab-balance')[0]!);
    expect(screen.getByTestId('balance-general-screen')).toBeInTheDocument();
  });

  it('switches to Flujo when the flujo tab is tapped', () => {
    renderWithProviders(<EstadosShell {...baseProps()} />);
    fireEvent.click(screen.getAllByTestId('estados-tab-flujo')[0]!);
    expect(screen.getByTestId('flujo-efectivo-screen')).toBeInTheDocument();
  });

  it('switches to Indicadores when the indicadores tab is tapped', () => {
    renderWithProviders(<EstadosShell {...baseProps()} />);
    fireEvent.click(screen.getAllByTestId('estados-tab-indicadores')[0]!);
    expect(screen.getByTestId('indicadores-screen')).toBeInTheDocument();
  });

  it('renders the ISR disclaimer on Resultados and Indicadores but not on Balance/Flujo', () => {
    const { rerender } = renderWithProviders(<EstadosShell {...baseProps()} />);
    expect(screen.getByTestId('isr-disclaimer')).toBeInTheDocument();

    fireEvent.click(screen.getAllByTestId('estados-tab-balance')[0]!);
    expect(screen.queryByTestId('isr-disclaimer')).toBeNull();

    fireEvent.click(screen.getAllByTestId('estados-tab-flujo')[0]!);
    expect(screen.queryByTestId('isr-disclaimer')).toBeNull();

    fireEvent.click(screen.getAllByTestId('estados-tab-indicadores')[0]!);
    expect(screen.getByTestId('isr-disclaimer')).toBeInTheDocument();
    rerender(<EstadosShell {...baseProps()} />);
  });
});
