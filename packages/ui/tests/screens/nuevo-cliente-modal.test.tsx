/**
 * NuevoClienteModal tests (P1C-M3-T03).
 */

import { describe, expect, it, vi } from 'vitest';
import { NuevoClienteModal } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('NuevoClienteModal', () => {
  it('renders name + phone + email + note fields when open', () => {
    renderWithProviders(<NuevoClienteModal open onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('nuevo-cliente-nombre')).toBeInTheDocument();
    expect(screen.getByTestId('nuevo-cliente-telefono')).toBeInTheDocument();
    expect(screen.getByTestId('nuevo-cliente-email')).toBeInTheDocument();
    expect(screen.getByTestId('nuevo-cliente-nota')).toBeInTheDocument();
  });

  it('blocks submit with an empty nombre', () => {
    const onSubmit = vi.fn();
    renderWithProviders(<NuevoClienteModal open onClose={vi.fn()} onSubmit={onSubmit} />);
    const submit = screen.getAllByTestId('nuevo-cliente-submit')[0]!;
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not render when open=false', () => {
    renderWithProviders(<NuevoClienteModal open={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.queryByTestId('nuevo-cliente-modal')).toBeNull();
  });
});
