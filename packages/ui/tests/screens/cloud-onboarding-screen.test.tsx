/**
 * CloudOnboardingScreen tests (P1E-M4 C14).
 */

import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { CloudOnboardingScreen } from '../../src/screens/CloudOnboarding/cloud-onboarding-screen';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const FAKE_CREDS = {
  accessToken: 'tok',
  userId: 'u1',
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
  role: 'Director' as const,
  expiresAt: Date.now() + 3_600_000,
};

function render(node: ReactElement) {
  return renderWithProviders(node);
}

describe('CloudOnboardingScreen', () => {
  it('shows the disabled notice when backendConfigured=false', () => {
    render(
      <CloudOnboardingScreen
        backendConfigured={false}
        onSignIn={vi.fn()}
        onSignUp={vi.fn()}
        onSuccess={vi.fn()}
        onOpenAdvanced={vi.fn()}
      />,
    );
    expect(screen.getByTestId('cloud-onboarding-disabled')).not.toBeNull();
    expect(screen.queryByTestId('cloud-email-input')).toBeNull();
  });

  it('renders the sign-in form by default when backend is configured', () => {
    render(
      <CloudOnboardingScreen
        backendConfigured
        onSignIn={vi.fn()}
        onSignUp={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );
    expect(screen.getByTestId('cloud-email-input')).not.toBeNull();
    expect(screen.getByTestId('cloud-password-input')).not.toBeNull();
    expect(screen.queryByTestId('cloud-business-input')).toBeNull();
  });

  it('reveals the business-name field when switching to the signup tab', () => {
    render(
      <CloudOnboardingScreen
        backendConfigured
        onSignIn={vi.fn()}
        onSignUp={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('cloud-tab-signup'));
    expect(screen.getByTestId('cloud-business-input')).not.toBeNull();
  });

  it('surfaces auth failures as a danger tag', async () => {
    const onSignIn = vi.fn().mockRejectedValue(new Error('Credenciales inválidas'));
    render(
      <CloudOnboardingScreen
        backendConfigured
        onSignIn={onSignIn}
        onSignUp={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('cloud-submit'));
    // Wait for async error to render.
    await vi.waitFor(() => {
      expect(screen.getByTestId('cloud-onboarding-error').textContent).toMatch(/Credenciales/);
    });
  });

  it('calls onSuccess with credentials after a successful sign-in', async () => {
    const onSignIn = vi.fn().mockResolvedValue(FAKE_CREDS);
    const onSuccess = vi.fn();
    render(
      <CloudOnboardingScreen
        backendConfigured
        onSignIn={onSignIn}
        onSignUp={vi.fn()}
        onSuccess={onSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('cloud-submit'));
    await vi.waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(FAKE_CREDS);
    });
  });
});
