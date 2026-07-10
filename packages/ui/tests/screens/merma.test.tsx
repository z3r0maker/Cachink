/**
 * Merma screen tests — MermaCheckoutSheet coverage.
 *
 * Covers reason selection, nota field, submit gating, and error display.
 */

import { describe, expect, it, vi } from 'vitest';
import type { CartItem } from '../../src/hooks/use-cart';
import { MermaCheckoutSheet } from '../../src/screens/Merma/merma-checkout-sheet';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const CART_ITEMS: CartItem[] = [
  {
    productoId: 'P001' as any,
    nombre: 'Taco al pastor',
    precioUnitCentavos: 4500n,
    cantidad: 2,
  },
];

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  items: CART_ITEMS,
  onSubmit: vi.fn(),
  submitting: false,
};

function renderSheet(overrides: Partial<typeof defaultProps> = {}) {
  return renderWithProviders(
    <MermaCheckoutSheet {...defaultProps} {...overrides} />,
  );
}

describe('MermaCheckoutSheet', () => {
  it('renders the reason group', () => {
    renderSheet();
    expect(screen.getByTestId('merma-reason-group')).toBeInTheDocument();
  });

  it('renders the nota field', () => {
    renderSheet();
    expect(screen.getByTestId('merma-nota')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderSheet();
    expect(screen.getByTestId('merma-checkout-submit')).toBeInTheDocument();
  });

  it('calls onSubmit with default reason when submit is clicked', () => {
    const onSubmit = vi.fn();
    renderSheet({ onSubmit });
    fireEvent.click(screen.getByTestId('merma-checkout-submit'));
    expect(onSubmit).toHaveBeenCalledWith('Preparación incorrecta', null);
  });

  it('does not render when open is false', () => {
    renderSheet({ open: false });
    expect(screen.queryByTestId('merma-reason-group')).toBeNull();
  });

  it('shows error message when error is provided', () => {
    renderSheet({ error: new Error('Something went wrong') });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('does not submit when items array is empty', () => {
    const onSubmit = vi.fn();
    renderSheet({ items: [], onSubmit });
    fireEvent.click(screen.getByTestId('merma-checkout-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders with custom testID', () => {
    renderSheet({ testID: 'my-sheet' } as any);
    expect(screen.getByTestId('my-sheet')).toBeInTheDocument();
  });
});
