/**
 * BusinessType wizard step tests (UXD-R3 D1).
 */

import { describe, expect, it, vi } from 'vitest';
import { BusinessType } from '../../src/screens/Wizard/business-type';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('BusinessType', () => {
  it('renders four cards', () => {
    renderWithProviders(<BusinessType onSelect={vi.fn()} />);
    expect(screen.getByTestId('wizard-btype-producto-con-stock')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-btype-producto-sin-stock')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-btype-servicio')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-btype-mixto')).toBeInTheDocument();
  });

  it('renders the title', () => {
    renderWithProviders(<BusinessType onSelect={vi.fn()} />);
    expect(screen.getByText('¿Qué tipo de negocio tienes?')).toBeInTheDocument();
  });

  it('calls onSelect with producto-con-stock choice when that card is tapped', () => {
    const onSelect = vi.fn();
    renderWithProviders(<BusinessType onSelect={onSelect} />);
    const card = screen.getByTestId('wizard-btype-producto-con-stock-card');
    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ tipoNegocio: 'producto-con-stock' }),
    );
  });

  it('pre-seeds atributos for producto-con-stock', () => {
    const onSelect = vi.fn();
    renderWithProviders(<BusinessType onSelect={onSelect} />);
    const card = screen.getByTestId('wizard-btype-producto-con-stock-card');
    fireEvent.click(card);
    const choice = onSelect.mock.calls[0]![0]!;
    expect(choice.atributosProducto).toHaveLength(3); // talla, color, marca
  });

  it('pre-seeds empty atributos for servicio', () => {
    const onSelect = vi.fn();
    renderWithProviders(<BusinessType onSelect={onSelect} />);
    const card = screen.getByTestId('wizard-btype-servicio-card');
    fireEvent.click(card);
    const choice = onSelect.mock.calls[0]![0]!;
    expect(choice.atributosProducto).toHaveLength(1); // duración
    expect(choice.categoriaVentaPredeterminada).toBe('Servicio');
  });
});
