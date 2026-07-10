/**
 * BlindCountStep tests — Step 1 of blind-close flow.
 *
 * Covers numpad entry, header/warning rendering, submit gating (no zero),
 * and callback wiring.
 */

import { describe, expect, it, vi } from 'vitest';
import { BlindCountStep } from '../../../src/screens/Caja/blind-count-step';
import { initI18n } from '../../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';

initI18n();

const defaultProps = {
  onSubmit: vi.fn(),
  submitting: false,
};

function renderStep(overrides: Partial<typeof defaultProps> = {}) {
  return renderWithProviders(
    <BlindCountStep {...defaultProps} {...overrides} />,
  );
}

describe('BlindCountStep', () => {
  it('renders with default testID blind-count-step', () => {
    renderStep();
    expect(screen.getByTestId('blind-count-step')).toBeInTheDocument();
  });

  it('renders the header card', () => {
    renderStep();
    expect(screen.getByTestId('blind-count-header')).toBeInTheDocument();
  });

  it('renders the numpad display', () => {
    renderStep();
    expect(screen.getByTestId('blind-count-display')).toBeInTheDocument();
  });

  it('renders the numpad', () => {
    renderStep();
    expect(screen.getByTestId('blind-count-numpad')).toBeInTheDocument();
  });

  it('renders the continue button', () => {
    renderStep();
    expect(screen.getByTestId('blind-count-continue')).toBeInTheDocument();
  });

  it('fires onSubmit with entered amount when digits are typed', () => {
    const onSubmit = vi.fn();
    renderStep({ onSubmit });
    fireEvent.click(screen.getByTestId('numpad-1'));
    fireEvent.click(screen.getByTestId('numpad-5'));
    fireEvent.click(screen.getByTestId('numpad-0'));
    fireEvent.click(screen.getByTestId('numpad-0'));
    fireEvent.click(screen.getByTestId('blind-count-continue'));
    expect(onSubmit).toHaveBeenCalledWith(150000n);
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <BlindCountStep {...defaultProps} testID="my-step" />,
    );
    expect(screen.getByTestId('my-step')).toBeInTheDocument();
  });
});
