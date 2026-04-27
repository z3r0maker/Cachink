/**
 * BalanceGeneralScreen tests (Slice 3 C13).
 */

import { describe, expect, it } from 'vitest';
import type { BalanceGeneral } from '@cachink/domain';
import { BalanceGeneralScreen } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

function balance(overrides: Partial<BalanceGeneral> = {}): BalanceGeneral {
  return {
    activo: {
      efectivo: 100_000n,
      inventarios: 50_000n,
      cuentasPorCobrar: 30_000n,
      total: 180_000n,
    },
    pasivo: { total: 0n },
    capital: { utilidadDelPeriodo: 60_000n, total: 60_000n },
    ...overrides,
  } as BalanceGeneral;
}

describe('BalanceGeneralScreen', () => {
  it('renders the three sections when balance is present', () => {
    renderWithProviders(<BalanceGeneralScreen balance={balance()} periodoLabel="Abril 2026" />);
    expect(screen.getByTestId('balance-activo-card')).toBeInTheDocument();
    expect(screen.getByTestId('balance-pasivo-capital-card')).toBeInTheDocument();
  });

  it('renders the totals as Kpi values', () => {
    renderWithProviders(<BalanceGeneralScreen balance={balance()} periodoLabel="Abril 2026" />);
    expect(screen.getByTestId('balance-activo-total').textContent).toContain('$1,800.00');
    expect(screen.getByTestId('balance-capital-total').textContent).toContain('$600.00');
  });

  it('shows the empty-period card when balance is null', () => {
    renderWithProviders(<BalanceGeneralScreen balance={null} periodoLabel="Abril 2026" />);
    expect(screen.getByTestId('balance-general-empty')).toBeInTheDocument();
  });

  it('renders the pasivo Tag when pasivo.total is zero', () => {
    renderWithProviders(<BalanceGeneralScreen balance={balance()} periodoLabel="Abril 2026" />);
    expect(screen.getByTestId('balance-pasivo-empty')).toBeInTheDocument();
    expect(screen.getByText('Sin pasivos registrados')).toBeInTheDocument();
  });
});
