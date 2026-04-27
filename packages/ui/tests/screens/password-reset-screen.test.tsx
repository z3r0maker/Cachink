/**
 * PasswordResetScreen tests (Slice 8 M3-C12).
 *
 * Covers the three render branches: idle form, sent confirmation tag,
 * error tag. Mounted via the standard `renderWithProviders` helper.
 */

import { describe, expect, it, vi } from 'vitest';
import { PasswordResetScreen } from '../../src/screens/CloudOnboarding/password-reset-screen';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

function getInput(testId: string): HTMLInputElement {
  return screen.getByTestId(testId).querySelector('input') as HTMLInputElement;
}

describe('PasswordResetScreen (Slice 8 M3-C12)', () => {
  it('renders the email input + submit + back CTAs by default', () => {
    renderWithProviders(<PasswordResetScreen onReset={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByTestId('password-reset-screen')).toBeInTheDocument();
    expect(screen.getByTestId('password-reset-email')).toBeInTheDocument();
    expect(screen.getByTestId('password-reset-submit')).toBeInTheDocument();
    expect(screen.getByTestId('password-reset-back')).toBeInTheDocument();
    expect(screen.queryByTestId('password-reset-sent')).toBeNull();
    expect(screen.queryByTestId('password-reset-error')).toBeNull();
  });

  it('shows the sent tag when onReset resolves successfully', async () => {
    const onReset = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<PasswordResetScreen onReset={onReset} onBack={vi.fn()} />);
    fireEvent.change(getInput('password-reset-email'), {
      target: { value: 'tu@correo.com' },
    });
    fireEvent.click(screen.getByTestId('password-reset-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('password-reset-sent')).toBeInTheDocument();
    });
    expect(onReset).toHaveBeenCalledWith('tu@correo.com');
  });

  it('surfaces the error tag when onReset rejects', async () => {
    const onReset = vi.fn().mockRejectedValue(new Error('Correo inválido'));
    renderWithProviders(<PasswordResetScreen onReset={onReset} onBack={vi.fn()} />);
    fireEvent.change(getInput('password-reset-email'), {
      target: { value: 'malformed' },
    });
    fireEvent.click(screen.getByTestId('password-reset-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('password-reset-error').textContent).toMatch(/Correo inválido/);
    });
  });

  it('fires onBack when the back CTA is pressed', () => {
    const onBack = vi.fn();
    renderWithProviders(<PasswordResetScreen onReset={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByTestId('password-reset-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
