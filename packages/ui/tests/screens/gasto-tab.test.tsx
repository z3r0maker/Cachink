/**
 * GastoTab tests (Slice 2 C3, M4-T02 gasto).
 */

import { describe, expect, it, vi } from 'vitest';
import type { BusinessId, IsoDate } from '@cachink/domain';
import { GastoTab } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const businessId = '01JPHK00000000000000000008' as BusinessId;
const fecha = '2026-04-24' as IsoDate;

describe('GastoTab', () => {
  it('renders concepto, categoria, monto, proveedor fields', () => {
    renderWithProviders(<GastoTab businessId={businessId} fecha={fecha} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('gasto-concepto')).toBeInTheDocument();
    expect(screen.getByTestId('gasto-categoria')).toBeInTheDocument();
    expect(screen.getByTestId('gasto-monto')).toBeInTheDocument();
    expect(screen.getByTestId('gasto-proveedor')).toBeInTheDocument();
  });

  it('blocks submit when concepto or monto is empty', () => {
    const onSubmit = vi.fn();
    renderWithProviders(<GastoTab businessId={businessId} fecha={fecha} onSubmit={onSubmit} />);
    const submit = screen.getAllByTestId('gasto-submit')[0]!;
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submit button disables when submitting is true', () => {
    renderWithProviders(
      <GastoTab businessId={businessId} fecha={fecha} onSubmit={vi.fn()} submitting />,
    );
    const btn = screen.getAllByTestId('gasto-submit')[0]!;
    expect(getComputedStyle(btn).opacity).toBe('0.5');
  });

  it('recurrente fields are hidden by default', () => {
    renderWithProviders(<GastoTab businessId={businessId} fecha={fecha} onSubmit={vi.fn()} />);
    expect(screen.queryByTestId('recurrente-frecuencia')).toBeNull();
  });

  it('reveals recurrente fields when the toggle is tapped', () => {
    renderWithProviders(<GastoTab businessId={businessId} fecha={fecha} onSubmit={vi.fn()} />);
    const toggle = screen.getAllByTestId('gasto-recurrente-toggle')[0]!;
    fireEvent.click(toggle);
    expect(screen.getByTestId('recurrente-frecuencia')).toBeInTheDocument();
  });
});
