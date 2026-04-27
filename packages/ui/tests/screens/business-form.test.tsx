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

  it('omits the back button when no onBack handler is supplied', () => {
    renderWithProviders(<BusinessForm onSubmit={vi.fn()} />);
    expect(screen.queryByTestId('business-back')).toBeNull();
  });

  it('renders a ghost back button when onBack is supplied', () => {
    renderWithProviders(<BusinessForm onSubmit={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByTestId('business-back')).toBeInTheDocument();
  });

  it('fires onBack when the back button is pressed', () => {
    const onBack = vi.fn();
    renderWithProviders(<BusinessForm onSubmit={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByTestId('business-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('disables the back button while submitting', () => {
    renderWithProviders(<BusinessForm onSubmit={vi.fn()} onBack={vi.fn()} submitting />);
    // Disabled Btn collapses to opacity 0.5 (same convention SubmitRow uses).
    expect(getComputedStyle(screen.getByTestId('business-back')).opacity).toBe('0.5');
  });

  it('constrains the form column to 480 px and centers it on the viewport', () => {
    renderWithProviders(<BusinessForm onSubmit={vi.fn()} />);

    // The outer screen is the existing testID — keeps the public test handle.
    const screenRoot = screen.getByTestId('business-form');
    // The inner column is the new wrapper that owns the width constraint.
    const content = screen.getByTestId('business-form-content');

    expect(content).toBeInTheDocument();

    // Tamagui emits these as atomic classes in jsdom; getComputedStyle picks
    // them up after the layout pass — same pattern the Modal regression test
    // uses for fixed/inset/margin.
    const screenComputed = window.getComputedStyle(screenRoot);
    expect(screenComputed.alignItems).toBe('center');
    expect(screenComputed.justifyContent).toBe('center');

    const contentComputed = window.getComputedStyle(content);
    expect(contentComputed.maxWidth).toBe('480px');
    expect(contentComputed.width).toBe('100%');
  });
});
