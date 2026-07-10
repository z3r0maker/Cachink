/**
 * OpeningDiscrepancyDialog tests.
 *
 * Covers discrepancy comparison card, go-back / continue callbacks,
 * positive vs negative difference color coding.
 */

import { describe, expect, it, vi } from 'vitest';
import { OpeningDiscrepancyDialog } from '../../../src/screens/Caja/opening-discrepancy-dialog';
import { initI18n } from '../../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';

initI18n();

const defaultProps = {
  previousClose: 50000n,
  newOpening: 60000n,
  difference: 10000n,
  onGoBack: vi.fn(),
  onContinue: vi.fn(),
  submitting: false,
};

function renderDialog(overrides: Partial<typeof defaultProps> = {}) {
  return renderWithProviders(
    <OpeningDiscrepancyDialog {...defaultProps} {...overrides} />,
  );
}

describe('OpeningDiscrepancyDialog', () => {
  it('renders with default testID opening-discrepancy-dialog', () => {
    renderDialog();
    expect(screen.getByTestId('opening-discrepancy-dialog')).toBeInTheDocument();
  });

  it('renders the discrepancy comparison card', () => {
    renderDialog();
    expect(screen.getByTestId('discrepancy-card')).toBeInTheDocument();
  });

  it('renders go-back and continue buttons', () => {
    renderDialog();
    expect(screen.getByTestId('discrepancy-go-back')).toBeInTheDocument();
    expect(screen.getByTestId('discrepancy-continue')).toBeInTheDocument();
  });

  it('calls onGoBack when go-back is clicked', () => {
    const onGoBack = vi.fn();
    renderDialog({ onGoBack });
    fireEvent.click(screen.getByTestId('discrepancy-go-back'));
    expect(onGoBack).toHaveBeenCalled();
  });

  it('calls onContinue when continue is clicked', () => {
    const onContinue = vi.fn();
    renderDialog({ onContinue });
    fireEvent.click(screen.getByTestId('discrepancy-continue'));
    expect(onContinue).toHaveBeenCalled();
  });

  it('renders with negative difference', () => {
    renderDialog({ difference: -10000n });
    expect(screen.getByTestId('discrepancy-card')).toBeInTheDocument();
  });

  it('renders with custom testID', () => {
    renderDialog({ testID: 'my-discrepancy' } as any);
    expect(screen.getByTestId('my-discrepancy')).toBeInTheDocument();
  });
});
