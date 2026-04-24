/**
 * BusinessForm component tests (P1C-M2-T05).
 */

import { describe, expect, it, vi } from 'vitest';
import { BusinessForm } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

function getButton(): HTMLElement {
  return screen.getAllByTestId('business-submit')[0]!;
}

describe('BusinessForm', () => {
  it('renders nombre, regimen, and ISR fields with defaults', () => {
    renderWithProviders(<BusinessForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId('business-nombre')).toBeInTheDocument();
    expect(screen.getByTestId('business-regimen')).toBeInTheDocument();
    expect(screen.getByTestId('business-isr')).toBeInTheDocument();
  });

  it('blocks submit when nombre is empty', () => {
    const onSubmit = vi.fn();
    renderWithProviders(<BusinessForm onSubmit={onSubmit} />);
    fireEvent.click(getButton());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a valid payload with converted ISR (30% → 0.30) from defaults', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <BusinessForm
        onSubmit={onSubmit}
        defaults={{ nombre: 'Taquería Don Pedro', regimenFiscal: 'RIF', isrTasa: 0.3 }}
      />,
    );
    fireEvent.click(getButton());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Taquería Don Pedro',
        regimenFiscal: 'RIF',
        isrTasa: 0.3,
      }),
    );
  });

  it('rejects an out-of-range ISR percent', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <BusinessForm
        onSubmit={onSubmit}
        defaults={{ nombre: 'Test', regimenFiscal: 'RIF', isrTasa: 1.5 }}
      />,
    );
    fireEvent.click(getButton());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables the submit button when `submitting` is true', () => {
    renderWithProviders(<BusinessForm onSubmit={vi.fn()} submitting />);
    const root = getButton();
    // Disabled Btn has opacity 0.5 per the Btn primitive.
    expect(getComputedStyle(root).opacity).toBe('0.5');
  });
});
