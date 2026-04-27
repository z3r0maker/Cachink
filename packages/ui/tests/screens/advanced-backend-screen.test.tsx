/**
 * AdvancedBackendScreen tests (P1E-M4 C14) — the BYO backend screen
 * must reject service-role keys and require an HTTPS project URL.
 */

import { describe, expect, it, vi } from 'vitest';
import { AdvancedBackendScreen } from '../../src/screens/CloudOnboarding/advanced-backend-screen';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

// Minimal JWT with role:"service_role" — payload only, no signature.
const SERVICE_ROLE_JWT_PAYLOAD = btoa(JSON.stringify({ role: 'service_role', iss: 'supabase' }));
const SERVICE_ROLE_JWT = `header.${SERVICE_ROLE_JWT_PAYLOAD}.sig`;

function getInput(testId: string): HTMLInputElement {
  return screen.getByTestId(testId).querySelector('input') as HTMLInputElement;
}

describe('AdvancedBackendScreen field validation', () => {
  it('refuses an HTTP (non-https) project URL', () => {
    const onSave = vi.fn();
    renderWithProviders(
      <AdvancedBackendScreen
        existing={null}
        onSave={onSave}
        onClear={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.change(getInput('advanced-url-input'), {
      target: { value: 'http://insecure.example.com' },
    });
    fireEvent.change(getInput('advanced-anon-input'), {
      target: { value: 'anon-long-enough-12345' },
    });
    fireEvent.click(screen.getByTestId('advanced-save'));
    expect(screen.getByTestId('advanced-error').textContent).toMatch(/https/);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('refuses a service-role JWT', () => {
    const onSave = vi.fn();
    renderWithProviders(
      <AdvancedBackendScreen
        existing={null}
        onSave={onSave}
        onClear={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.change(getInput('advanced-url-input'), {
      target: { value: 'https://proyecto.supabase.co' },
    });
    fireEvent.change(getInput('advanced-anon-input'), {
      target: { value: SERVICE_ROLE_JWT },
    });
    fireEvent.click(screen.getByTestId('advanced-save'));
    expect(screen.getByTestId('advanced-error').textContent).toMatch(/service-role/i);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('accepts a valid URL + anon key and calls onSave', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <AdvancedBackendScreen
        existing={null}
        onSave={onSave}
        onClear={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.change(getInput('advanced-url-input'), {
      target: { value: 'https://proyecto.supabase.co' },
    });
    fireEvent.change(getInput('advanced-anon-input'), {
      target: { value: 'eyJhlongpublishableanonymouskeyvalue' },
    });
    fireEvent.click(screen.getByTestId('advanced-save'));
    await vi.waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
    const args = onSave.mock.calls[0]![0] as { projectUrl: string; anonKey: string };
    expect(args.projectUrl).toBe('https://proyecto.supabase.co');
    expect(args.anonKey).toMatch(/^eyJ/);
  });
});
