/**
 * ManualVentaForm component tests (UXD-R3 C2).
 */

import { describe, expect, it, vi } from 'vitest';
import { ManualVentaForm } from '../../src/screens/Ventas/manual-venta-form';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

describe('ManualVentaForm', () => {
  it('renders concepto and monto inputs', () => {
    renderWithProviders(<ManualVentaForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId('manual-venta-concepto')).toBeInTheDocument();
    expect(screen.getByTestId('manual-venta-monto')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderWithProviders(<ManualVentaForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId('manual-venta-submit')).toBeInTheDocument();
  });

  it('renders with the manual-venta-form testID', () => {
    renderWithProviders(<ManualVentaForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId('manual-venta-form')).toBeInTheDocument();
  });
});
