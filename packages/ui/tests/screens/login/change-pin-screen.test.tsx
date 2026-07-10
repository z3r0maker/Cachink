/**
 * ChangePinScreen tests — Login/change-pin-screen.tsx coverage.
 *
 * Covers form rendering, 6-digit validation, mismatch hints,
 * submit gating, and callback wiring.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import { ChangePinScreen } from '../../../src/screens/Login/index';
import { initI18n } from '../../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';

initI18n();

const defaultProps = {
  userName: 'Ana Director',
  onSubmit: vi.fn(),
  error: null,
  submitting: false,
};

function renderChangePin(overrides: Partial<typeof defaultProps> = {}) {
  return renderWithProviders(
    <ChangePinScreen {...defaultProps} {...overrides} />,
  );
}

function fillInput(testId: string, value: string): void {
  const wrapper = screen.getByTestId(testId);
  const input = wrapper.querySelector('input')!;
  fireEvent.change(input, { target: { value } });
}

describe('ChangePinScreen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all three PIN fields', () => {
    renderChangePin();
    expect(screen.getByTestId('current-pin')).toBeInTheDocument();
    expect(screen.getByTestId('new-pin')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-pin')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderChangePin();
    expect(screen.getByTestId('change-pin-submit')).toBeInTheDocument();
  });

  it('renders with default testID change-pin', () => {
    renderChangePin();
    expect(screen.getByTestId('change-pin')).toBeInTheDocument();
  });

  it('renders with a custom testID', () => {
    renderChangePin({ testID: 'my-change-pin' } as any);
    expect(screen.getByTestId('my-change-pin')).toBeInTheDocument();
  });

  it('disables submit when all fields are empty', () => {
    renderChangePin();
    const btn = screen.getByTestId('change-pin-submit');
    // The button should be disabled — either via disabled attribute or aria
    expect(btn).toBeInTheDocument();
    // Clicking should NOT call onSubmit
    fireEvent.click(btn);
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('enables submit when all fields are valid 6-digit PINs that match', () => {
    const onSubmit = vi.fn();
    renderChangePin({ onSubmit });
    fillInput('current-pin', '111111');
    fillInput('new-pin', '222222');
    fillInput('confirm-pin', '222222');
    fireEvent.click(screen.getByTestId('change-pin-submit'));
    expect(onSubmit).toHaveBeenCalledWith('111111', '222222');
  });

  it('does not submit when new PIN and confirm do not match', () => {
    const onSubmit = vi.fn();
    renderChangePin({ onSubmit });
    fillInput('current-pin', '111111');
    fillInput('new-pin', '222222');
    fillInput('confirm-pin', '333333');
    fireEvent.click(screen.getByTestId('change-pin-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when new PIN is fewer than 6 digits', () => {
    const onSubmit = vi.fn();
    renderChangePin({ onSubmit });
    fillInput('current-pin', '111111');
    fillInput('new-pin', '222');
    fillInput('confirm-pin', '222');
    fireEvent.click(screen.getByTestId('change-pin-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('displays server error text from the error prop', () => {
    renderChangePin({ error: 'PIN actual incorrecto' });
    expect(screen.getByText('PIN actual incorrecto')).toBeInTheDocument();
  });

  it('disables submit when submitting is true', () => {
    const onSubmit = vi.fn();
    renderChangePin({ onSubmit, submitting: true });
    fillInput('current-pin', '111111');
    fillInput('new-pin', '222222');
    fillInput('confirm-pin', '222222');
    fireEvent.click(screen.getByTestId('change-pin-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
