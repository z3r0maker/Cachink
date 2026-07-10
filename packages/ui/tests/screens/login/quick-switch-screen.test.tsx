/**
 * QuickSwitchScreen tests — Login/quick-switch-screen.tsx coverage.
 *
 * Verifies avatar grid rendering, user selection → PIN prompt slide-in,
 * onAuthenticate + onForgotPin callback wiring.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import type { UserId } from '@cachink/domain';
import { makeUser } from '@cachink/testing';
import { QuickSwitchScreen } from '../../../src/screens/Login/index';
import { initI18n } from '../../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';

initI18n();

const USER_A = makeUser({
  id: '01JPHK0000000000000000USR1' as UserId,
  nombre: 'Ana Director',
  role: 'director',
  avatarColor: 'blue',
});
const USER_B = makeUser({
  id: '01JPHK0000000000000000USR2' as UserId,
  nombre: 'Beto Operativo',
  role: 'operativo',
  avatarColor: 'green',
});

const defaultProps = {
  users: [USER_A, USER_B],
  onAuthenticate: vi.fn(),
  error: null,
  submitting: false,
};

function renderScreen(overrides: Partial<typeof defaultProps> = {}) {
  return renderWithProviders(
    <QuickSwitchScreen {...defaultProps} {...overrides} />,
  );
}

describe('QuickSwitchScreen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders one avatar per user', () => {
    renderScreen();
    expect(screen.getByTestId(`user-avatar-${USER_A.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`user-avatar-${USER_B.id}`)).toBeInTheDocument();
  });

  it('renders role badges for each user', () => {
    renderScreen();
    expect(screen.getByTestId(`user-role-${USER_A.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`user-role-${USER_B.id}`)).toBeInTheDocument();
  });

  it('shows the PIN prompt when a user avatar is tapped', () => {
    renderScreen();
    // Before selection, PIN prompt should not be visible (collapsed)
    const pinPrompt = screen.queryByTestId('pin-prompt');
    // After selecting a user, the prompt should appear
    fireEvent.click(screen.getByTestId(`user-avatar-${USER_A.id}`));
    expect(screen.getByTestId('pin-prompt')).toBeInTheDocument();
  });

  it('displays the selected user name in the PIN prompt', () => {
    renderScreen();
    fireEvent.click(screen.getByTestId(`user-avatar-${USER_A.id}`));
    // Name appears in both the avatar and the PIN prompt
    const matches = screen.getAllByText('Ana Director');
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('fires onAuthenticate with userId and pin on submit via numpad', () => {
    const onAuthenticate = vi.fn();
    renderScreen({ onAuthenticate });
    fireEvent.click(screen.getByTestId(`user-avatar-${USER_A.id}`));
    // PinCodeInput uses numpad mode in PinPrompt — press 6 digit buttons
    fireEvent.click(screen.getByTestId('numpad-1'));
    fireEvent.click(screen.getByTestId('numpad-2'));
    fireEvent.click(screen.getByTestId('numpad-3'));
    fireEvent.click(screen.getByTestId('numpad-4'));
    fireEvent.click(screen.getByTestId('numpad-5'));
    fireEvent.click(screen.getByTestId('numpad-6'));
    // onComplete triggers auto-submit via handleComplete
    expect(onAuthenticate).toHaveBeenCalledWith(USER_A.id, '123456');
  });

  it('shows forgot-pin link when onForgotPin is provided', () => {
    const onForgotPin = vi.fn();
    renderScreen({ onForgotPin });
    fireEvent.click(screen.getByTestId(`user-avatar-${USER_A.id}`));
    expect(screen.getByTestId('forgot-pin-link')).toBeInTheDocument();
  });

  it('does not show forgot-pin link when onForgotPin is not provided', () => {
    renderScreen();
    fireEvent.click(screen.getByTestId(`user-avatar-${USER_A.id}`));
    expect(screen.queryByTestId('forgot-pin-link')).toBeNull();
  });

  it('fires onForgotPin with the selected userId', () => {
    const onForgotPin = vi.fn();
    renderScreen({ onForgotPin });
    fireEvent.click(screen.getByTestId(`user-avatar-${USER_A.id}`));
    fireEvent.click(screen.getByTestId('forgot-pin-link'));
    expect(onForgotPin).toHaveBeenCalledWith(USER_A.id);
  });

  it('shows error text from the error prop', () => {
    renderScreen({ error: 'PIN incorrecto' });
    fireEvent.click(screen.getByTestId(`user-avatar-${USER_A.id}`));
    expect(screen.getByText('PIN incorrecto')).toBeInTheDocument();
  });

  it('renders with a custom testID', () => {
    renderScreen({ testID: 'my-quick-switch' } as any);
    expect(screen.getByTestId('my-quick-switch')).toBeInTheDocument();
  });

  it('renders with default testID quick-switch', () => {
    renderScreen();
    expect(screen.getByTestId('quick-switch')).toBeInTheDocument();
  });
});
