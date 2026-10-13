/**
 * NuevoEgresoModal tests — scaffold + tab-switcher (Slice 2 C2, ADR-020).
 */

import { describe, expect, it, vi } from 'vitest';
import { NuevoEgresoModal } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('NuevoEgresoModal', () => {
  it('does not render body when open=false', () => {
    renderWithProviders(<NuevoEgresoModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('nuevo-egreso-modal')).toBeNull();
  });

  it('renders both tabs when open', () => {
    renderWithProviders(<NuevoEgresoModal open onClose={vi.fn()} />);
    expect(screen.getByTestId('egreso-tab-gasto')).toBeInTheDocument();
    expect(screen.getByTestId('egreso-tab-inventario')).toBeInTheDocument();
    expect(screen.queryByTestId('egreso-tab-nomina')).toBeNull();
  });

  it('defaults to the gasto tab', () => {
    renderWithProviders(<NuevoEgresoModal open onClose={vi.fn()} />);
    expect(screen.getByTestId('egreso-tab-body-gasto')).toBeInTheDocument();
    expect(screen.queryByTestId('egreso-tab-body-inventario')).toBeNull();
  });

  it('switches tab on tap', () => {
    renderWithProviders(<NuevoEgresoModal open onClose={vi.fn()} />);
    const inventarioTab = screen.getAllByTestId('egreso-tab-inventario')[0]!;
    fireEvent.click(inventarioTab);
    expect(screen.getByTestId('egreso-tab-body-inventario')).toBeInTheDocument();
    expect(screen.queryByTestId('egreso-tab-body-gasto')).toBeNull();
  });

  it('honours initialTab when provided', () => {
    renderWithProviders(<NuevoEgresoModal open onClose={vi.fn()} initialTab="inventario" />);
    expect(screen.getByTestId('egreso-tab-body-inventario')).toBeInTheDocument();
  });

  it('renders custom tab bodies via render-props when provided', () => {
    renderWithProviders(
      <NuevoEgresoModal
        open
        onClose={vi.fn()}
        renderGastoTab={() => <span data-testid="custom-gasto">gasto-body</span>}
      />,
    );
    expect(screen.getByTestId('custom-gasto')).toBeInTheDocument();
    expect(screen.queryByTestId('egreso-tab-body-gasto')).toBeNull();
  });

  it('fires onClose when Cancelar is tapped', () => {
    const onClose = vi.fn();
    renderWithProviders(<NuevoEgresoModal open onClose={onClose} />);
    const cancel = screen.getAllByTestId('nuevo-egreso-cancel')[0]!;
    fireEvent.click(cancel);
    expect(onClose).toHaveBeenCalled();
  });
});
