/**
 * CajaMovimientoSheet tests — deposit/withdraw bottom sheet.
 *
 * Covers deposit/retiro labels, numpad input, motivo field,
 * submit gating (amount + motivo required).
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import { CajaMovimientoSheet } from '../../../src/screens/Caja/caja-movimiento-sheet';
import { initI18n } from '../../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';

initI18n();

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  tipo: 'deposito' as const,
  onSubmit: vi.fn(),
  submitting: false,
};

function renderSheet(overrides: Partial<typeof defaultProps> = {}) {
  return renderWithProviders(
    <CajaMovimientoSheet {...defaultProps} {...overrides} />,
  );
}

describe('CajaMovimientoSheet', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders for deposito with correct title', () => {
    renderSheet();
    expect(screen.getByText('Agregar efectivo')).toBeInTheDocument();
  });

  it('renders for retiro with correct title', () => {
    renderSheet({ tipo: 'retiro' });
    expect(screen.getByText('Retirar efectivo')).toBeInTheDocument();
  });

  it('renders with deposito question', () => {
    renderSheet();
    expect(screen.getByText('¿Cuánto agregas?')).toBeInTheDocument();
  });

  it('renders with retiro question', () => {
    renderSheet({ tipo: 'retiro' });
    expect(screen.getByText('¿Cuánto retiras?')).toBeInTheDocument();
  });

  it('renders the motivo input field', () => {
    renderSheet();
    expect(screen.getByTestId('caja-movimiento-motivo')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderSheet();
    expect(screen.getByTestId('caja-movimiento-submit')).toBeInTheDocument();
  });

  it('renders the numpad', () => {
    renderSheet();
    expect(screen.getByTestId('numpad')).toBeInTheDocument();
  });

  it('does not call onSubmit when amount is zero', () => {
    const onSubmit = vi.fn();
    renderSheet({ onSubmit });
    // Fill motivo but leave amount at zero
    const motivoInput = screen.getByTestId('caja-movimiento-motivo').querySelector('input')!;
    fireEvent.change(motivoInput, { target: { value: 'Test motivo' } });
    fireEvent.click(screen.getByTestId('caja-movimiento-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit when motivo is empty', () => {
    const onSubmit = vi.fn();
    renderSheet({ onSubmit });
    // Type amount via numpad but leave motivo empty
    fireEvent.click(screen.getByTestId('numpad-1'));
    fireEvent.click(screen.getByTestId('numpad-0'));
    fireEvent.click(screen.getByTestId('numpad-0'));
    fireEvent.click(screen.getByTestId('caja-movimiento-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with amount and motivo when both are filled', () => {
    const onSubmit = vi.fn();
    renderSheet({ onSubmit });
    // Type amount
    fireEvent.click(screen.getByTestId('numpad-5'));
    fireEvent.click(screen.getByTestId('numpad-0'));
    fireEvent.click(screen.getByTestId('numpad-0'));
    // Fill motivo
    const motivoInput = screen.getByTestId('caja-movimiento-motivo').querySelector('input')!;
    fireEvent.change(motivoInput, { target: { value: 'Cambio monedas' } });
    fireEvent.click(screen.getByTestId('caja-movimiento-submit'));
    expect(onSubmit).toHaveBeenCalledWith(50000n, 'Cambio monedas');
  });

  it('does not render when open is false', () => {
    renderSheet({ open: false });
    expect(screen.queryByText('Agregar efectivo')).toBeNull();
  });
});
