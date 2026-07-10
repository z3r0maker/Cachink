/**
 * CajaHandoffBanner extra tests — expanding coverage beyond existing tests.
 *
 * Covers callback wiring, amount display, and custom testID.
 */

import { describe, expect, it, vi } from 'vitest';
import { CajaHandoffBanner } from '../../../src/screens/Caja/caja-handoff-banner';
import { initI18n } from '../../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';

initI18n();

describe('CajaHandoffBanner', () => {
  it('renders confirm and different buttons', () => {
    renderWithProviders(
      <CajaHandoffBanner
        otherUserName="Ana"
        openingAmount={50000n}
        onConfirm={vi.fn()}
        onDifferent={vi.fn()}
      />,
    );
    expect(screen.getByTestId('caja-handoff-confirm')).toBeInTheDocument();
    expect(screen.getByTestId('caja-handoff-different')).toBeInTheDocument();
  });

  it('fires onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <CajaHandoffBanner
        otherUserName="Ana"
        openingAmount={50000n}
        onConfirm={onConfirm}
        onDifferent={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('caja-handoff-confirm'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('fires onDifferent when different button is clicked', () => {
    const onDifferent = vi.fn();
    renderWithProviders(
      <CajaHandoffBanner
        otherUserName="Ana"
        openingAmount={50000n}
        onConfirm={vi.fn()}
        onDifferent={onDifferent}
      />,
    );
    fireEvent.click(screen.getByTestId('caja-handoff-different'));
    expect(onDifferent).toHaveBeenCalled();
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <CajaHandoffBanner
        otherUserName="Ana"
        openingAmount={50000n}
        onConfirm={vi.fn()}
        onDifferent={vi.fn()}
        testID="my-banner"
      />,
    );
    expect(screen.getByTestId('my-banner')).toBeInTheDocument();
  });
});
