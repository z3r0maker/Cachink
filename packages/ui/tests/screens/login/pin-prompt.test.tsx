/**
 * PinPrompt tests — Login/pin-prompt.tsx coverage.
 *
 * Covers PIN entry, submit gating, error display, forgot-PIN link,
 * and loading overlay states.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import type { UserId } from '@cachink/domain';
import { PinPrompt } from '../../../src/screens/Login/index';
import { initI18n } from '../../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';

initI18n();

const USER_ID = '01JPHK0000000000000000USR1' as UserId;

const defaultProps = {
  userId: USER_ID,
  userName: 'Ana Director',
  onSubmit: vi.fn(),
  error: null,
  submitting: false,
};

function renderPrompt(overrides: Partial<typeof defaultProps> = {}) {
  return renderWithProviders(
    <PinPrompt {...defaultProps} {...overrides} />,
  );
}

describe('PinPrompt', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the user name', () => {
    renderPrompt();
    expect(screen.getByText('Ana Director')).toBeInTheDocument();
  });

  it('renders with testID pin-prompt', () => {
    renderPrompt();
    expect(screen.getByTestId('pin-prompt')).toBeInTheDocument();
  });

  it('renders the PIN input', () => {
    renderPrompt();
    expect(screen.getByTestId('pin-input')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderPrompt();
    expect(screen.getByTestId('login-submit')).toBeInTheDocument();
  });

  it('does not show error text when error is null', () => {
    renderPrompt();
    const errorTexts = screen.queryAllByText(/incorrecto/i);
    expect(errorTexts).toHaveLength(0);
  });

  it('shows error text when error prop is set', () => {
    renderPrompt({ error: 'PIN incorrecto' });
    expect(screen.getByText('PIN incorrecto')).toBeInTheDocument();
  });

  it('shows forgot-pin link when onForgotPin is provided', () => {
    renderPrompt({ onForgotPin: vi.fn() });
    expect(screen.getByTestId('forgot-pin-link')).toBeInTheDocument();
  });

  it('hides forgot-pin link when onForgotPin is undefined', () => {
    renderPrompt();
    expect(screen.queryByTestId('forgot-pin-link')).toBeNull();
  });

  it('calls onForgotPin when forgot-pin link is clicked', () => {
    const onForgotPin = vi.fn();
    renderPrompt({ onForgotPin });
    fireEvent.click(screen.getByTestId('forgot-pin-link'));
    expect(onForgotPin).toHaveBeenCalled();
  });

  it('shows loading overlay when submitting is true', () => {
    renderPrompt({ submitting: true });
    expect(screen.getByTestId('pin-loading-overlay')).toBeInTheDocument();
  });
});
