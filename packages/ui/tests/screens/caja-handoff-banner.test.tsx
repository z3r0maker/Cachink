/**
 * CajaHandoffBanner component tests.
 *
 * Pure render test — no repository mocks needed.
 */

import { describe, expect, it, vi } from 'vitest';
import { CajaHandoffBanner } from '../../src/screens/Caja/caja-handoff-banner';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen, fireEvent } from '../test-utils';

initI18n();

function defaultProps(overrides: Record<string, unknown> = {}) {
  return {
    otherUserName: 'Director Test',
    openingAmount: 150000n,
    onConfirm: vi.fn(),
    onDifferent: vi.fn(),
    ...overrides,
  };
}

describe('CajaHandoffBanner', () => {
  it('renders the other user name and formatted amount', () => {
    const props = defaultProps();
    const { container } = renderWithProviders(<CajaHandoffBanner {...props} />);
    const text = container.textContent ?? '';

    expect(text).toContain('Director Test ya abrió la caja');
    expect(text).toContain('$1,500');
  });

  it('calls onConfirm when "Confirmar monto" is pressed', () => {
    const onConfirm = vi.fn();
    const props = defaultProps({ onConfirm });
    renderWithProviders(<CajaHandoffBanner {...props} />);

    fireEvent.click(screen.getByTestId('caja-handoff-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onDifferent when "Registrar diferente" is pressed', () => {
    const onDifferent = vi.fn();
    const props = defaultProps({ onDifferent });
    renderWithProviders(<CajaHandoffBanner {...props} />);

    fireEvent.click(screen.getByTestId('caja-handoff-different'));
    expect(onDifferent).toHaveBeenCalledTimes(1);
  });

  it('disables confirm button when submitting=true (loading state)', () => {
    const props = defaultProps({ submitting: true });
    renderWithProviders(<CajaHandoffBanner {...props} />);

    const confirmBtn = screen.getByTestId('caja-handoff-confirm');
    // Btn with loading=true sets disabled and renders a spinner instead of text
    expect(confirmBtn).toBeTruthy();
    expect(confirmBtn.getAttribute('aria-disabled')).toBe('true');
  });
});
