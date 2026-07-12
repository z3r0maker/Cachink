/**
 * RecoveryScreen tests — Login/recovery-screen.tsx + recovery-form-fields.tsx.
 *
 * Covers the 3-layer PIN recovery flow (ADR-049): recovery password →
 * new PIN → confirm PIN, plus factory-reset and back button wiring.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import type { UserId } from '@cachink/domain';
import { RecoveryScreen } from '../../../src/screens/Login/index';
import { initI18n } from '../../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';

initI18n();

const USER_ID = '01JPHK0000000000000000USR1' as UserId;

const defaultProps = {
  userId: USER_ID,
  maskedEmail: null as string | null,
  onRecoverWithPassword: vi.fn(),
  onFactoryReset: vi.fn(),
  onBack: vi.fn(),
  error: null,
  submitting: false,
};

function renderRecovery(overrides: Partial<typeof defaultProps> = {}) {
  return renderWithProviders(
    <RecoveryScreen {...defaultProps} {...overrides} />,
  );
}

function fillInput(testId: string, value: string): void {
  const wrapper = screen.getByTestId(testId);
  const input = wrapper.querySelector('input')!;
  fireEvent.change(input, { target: { value } });
}

describe('RecoveryScreen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with default testID recovery-screen', () => {
    renderRecovery();
    expect(screen.getByTestId('recovery-screen')).toBeInTheDocument();
  });

  it('renders recovery password field', () => {
    renderRecovery();
    expect(screen.getByTestId('recovery-password')).toBeInTheDocument();
  });

  it('renders new PIN and confirm PIN fields', () => {
    renderRecovery();
    expect(screen.getByTestId('recovery-new-pin')).toBeInTheDocument();
    expect(screen.getByTestId('recovery-confirm-pin')).toBeInTheDocument();
  });

  it('renders back button', () => {
    renderRecovery();
    expect(screen.getByTestId('recovery-back')).toBeInTheDocument();
  });

  it('renders factory reset button', () => {
    renderRecovery();
    expect(screen.getByTestId('recovery-factory-reset')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderRecovery();
    expect(screen.getByTestId('recovery-submit')).toBeInTheDocument();
  });

  it('calls onBack when back button is pressed', () => {
    const onBack = vi.fn();
    renderRecovery({ onBack });
    fireEvent.click(screen.getByTestId('recovery-back'));
    expect(onBack).toHaveBeenCalled();
  });

  it('calls onFactoryReset when factory reset is pressed', () => {
    const onFactoryReset = vi.fn();
    renderRecovery({ onFactoryReset });
    fireEvent.click(screen.getByTestId('recovery-factory-reset'));
    expect(onFactoryReset).toHaveBeenCalled();
  });

  it('shows error text from the error prop', () => {
    renderRecovery({ error: 'Contraseña incorrecta' });
    expect(screen.getByText('Contraseña incorrecta')).toBeInTheDocument();
  });

  it('does not show error text when error is null', () => {
    renderRecovery();
    expect(screen.queryByText('Contraseña incorrecta')).toBeNull();
  });

  it('shows email hint when maskedEmail is provided', () => {
    renderRecovery({ maskedEmail: 't***@test.com' });
    // The hint should contain the email
    const hintText = screen.getByText(/t\*\*\*@test\.com/);
    expect(hintText).toBeInTheDocument();
  });

  it('does not show email hint when maskedEmail is null', () => {
    renderRecovery({ maskedEmail: null });
    expect(screen.queryByText(/t\*\*\*@test\.com/)).toBeNull();
  });

  it('submits with password and new PIN when form is valid', () => {
    const onRecoverWithPassword = vi.fn();
    renderRecovery({ onRecoverWithPassword });

    // Fill password field — PasswordField uses onChange, find the input
    const pwField = screen.getByTestId('recovery-password');
    const pwInput = pwField.querySelector('input')!;
    fireEvent.change(pwInput, { target: { value: 'test123' } });

    fillInput('recovery-new-pin', '222222');
    fillInput('recovery-confirm-pin', '222222');

    fireEvent.click(screen.getByTestId('recovery-submit'));
    expect(onRecoverWithPassword).toHaveBeenCalledWith('test123', '222222');
  });

  it('does not submit when PIN fields do not match', () => {
    const onRecoverWithPassword = vi.fn();
    renderRecovery({ onRecoverWithPassword });

    const pwField = screen.getByTestId('recovery-password');
    const pwInput = pwField.querySelector('input')!;
    fireEvent.change(pwInput, { target: { value: 'test123' } });

    fillInput('recovery-new-pin', '222222');
    fillInput('recovery-confirm-pin', '333333');

    fireEvent.click(screen.getByTestId('recovery-submit'));
    expect(onRecoverWithPassword).not.toHaveBeenCalled();
  });

  it('does not submit when recovery password is too short', () => {
    const onRecoverWithPassword = vi.fn();
    renderRecovery({ onRecoverWithPassword });

    const pwField = screen.getByTestId('recovery-password');
    const pwInput = pwField.querySelector('input')!;
    fireEvent.change(pwInput, { target: { value: 'ab' } });

    fillInput('recovery-new-pin', '222222');
    fillInput('recovery-confirm-pin', '222222');

    fireEvent.click(screen.getByTestId('recovery-submit'));
    expect(onRecoverWithPassword).not.toHaveBeenCalled();
  });

  it('renders with a custom testID', () => {
    renderRecovery({ testID: 'my-recovery' } as any);
    expect(screen.getByTestId('my-recovery')).toBeInTheDocument();
  });
});
