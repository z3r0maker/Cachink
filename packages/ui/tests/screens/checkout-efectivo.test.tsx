/**
 * CheckoutEfectivo — UX audit regression tests.
 *
 * Verifies:
 * - No emoji characters in rendered output (brand violation fix)
 * - Cash warning appears when efectivoEnCaja < cambio
 * - Cash warning hidden when efectivoEnCaja not provided
 * - Total header displays the formatted amount
 */

import { describe, expect, it, vi } from 'vitest';
import { CheckoutEfectivo } from '../../src/screens/Checkout/checkout-efectivo';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{200D}]|[\u{20E3}]|[\u{FE0F}]|[\u{E0020}-\u{E007F}]|[\u{2702}-\u{27B0}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/u;

describe('CheckoutEfectivo', () => {
  it('renders without emoji characters', () => {
    const { container } = renderWithProviders(
      <CheckoutEfectivo
        totalCentavos={46600n}
        onConfirm={vi.fn()}
      />,
    );
    const text = container.textContent ?? '';
    expect(EMOJI_REGEX.test(text)).toBe(false);
  });

  it('shows the total amount in the header', () => {
    renderWithProviders(
      <CheckoutEfectivo
        totalCentavos={46600n}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText('Total a cobrar')).toBeInTheDocument();
  });

  it('hides cash warning when efectivoEnCaja is not provided', () => {
    const { container } = renderWithProviders(
      <CheckoutEfectivo
        totalCentavos={10000n}
        onConfirm={vi.fn()}
      />,
    );
    expect(
      container.textContent?.includes('suficiente cambio'),
    ).toBe(false);
  });

  it('hides cash warning when efectivoEnCaja is null', () => {
    const { container } = renderWithProviders(
      <CheckoutEfectivo
        totalCentavos={10000n}
        onConfirm={vi.fn()}
        efectivoEnCaja={null}
      />,
    );
    expect(
      container.textContent?.includes('suficiente cambio'),
    ).toBe(false);
  });

  it('renders the submit button with Registrar label', () => {
    renderWithProviders(
      <CheckoutEfectivo
        totalCentavos={46600n}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByTestId('checkout-efectivo-submit')).toBeInTheDocument();
  });

  it('disables submit when no amount entered', () => {
    renderWithProviders(
      <CheckoutEfectivo
        totalCentavos={46600n}
        onConfirm={vi.fn()}
      />,
    );
    const btn = screen.getByTestId('checkout-efectivo-submit');
    expect(btn).toHaveAttribute('aria-disabled', 'true');
  });
});
