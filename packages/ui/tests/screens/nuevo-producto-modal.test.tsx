/**
 * NuevoProductoModal tests (Slice 2 C14, M5-T03).
 */

import { describe, expect, it, vi } from 'vitest';
import { NuevoProductoModal } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('NuevoProductoModal', () => {
  it('renders every field when open', () => {
    renderWithProviders(<NuevoProductoModal open onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('producto-nombre')).toBeInTheDocument();
    expect(screen.getByTestId('producto-sku')).toBeInTheDocument();
    expect(screen.getByTestId('producto-categoria')).toBeInTheDocument();
    expect(screen.getByTestId('producto-costo')).toBeInTheDocument();
    expect(screen.getByTestId('producto-unidad')).toBeInTheDocument();
    expect(screen.getByTestId('producto-umbral')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    renderWithProviders(<NuevoProductoModal open={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.queryByTestId('nuevo-producto-modal')).toBeNull();
  });

  it('blocks submit with empty nombre', () => {
    const onSubmit = vi.fn();
    renderWithProviders(<NuevoProductoModal open onClose={vi.fn()} onSubmit={onSubmit} />);
    const submit = screen.getAllByTestId('producto-submit')[0]!;
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
