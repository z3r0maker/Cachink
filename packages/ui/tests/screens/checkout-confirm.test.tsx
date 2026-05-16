/**
 * CheckoutConfirm — UX audit regression tests.
 *
 * Verifies no emoji characters in button labels for all
 * payment methods (brand violation fix).
 */

import { describe, expect, it, vi } from 'vitest';
import type { PaymentMethod } from '@cachink/domain';
import { CheckoutConfirm } from '../../src/screens/Checkout/checkout-confirm';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{200D}]|[\u{20E3}]|[\u{FE0F}]|[\u{E0020}-\u{E007F}]|[\u{2702}-\u{27B0}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/u;

const METHODS: PaymentMethod[] = [
  'Tarjeta',
  'Transferencia',
  'QR/CoDi',
];

describe('CheckoutConfirm', () => {
  for (const metodo of METHODS) {
    it(`renders ${metodo} without emoji characters`, () => {
      const { container } = renderWithProviders(
        <CheckoutConfirm
          totalCentavos={46600n}
          metodo={metodo}
          onConfirm={vi.fn()}
        />,
      );
      const text = container.textContent ?? '';
      expect(EMOJI_REGEX.test(text)).toBe(false);
    });
  }

  it('renders the confirm button with the correct testID', () => {
    renderWithProviders(
      <CheckoutConfirm
        totalCentavos={10000n}
        metodo="Tarjeta"
        onConfirm={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId('checkout-confirm-Tarjeta-submit'),
    ).toBeInTheDocument();
  });

  it('shows payment method title', () => {
    renderWithProviders(
      <CheckoutConfirm
        totalCentavos={10000n}
        metodo="Transferencia"
        onConfirm={vi.fn()}
      />,
    );
    expect(
      screen.getByText('Transferencia (SPEI)'),
    ).toBeInTheDocument();
  });

  it('button label says "Cobro confirmado" for Tarjeta (no emoji)', () => {
    renderWithProviders(
      <CheckoutConfirm
        totalCentavos={10000n}
        metodo="Tarjeta"
        onConfirm={vi.fn()}
      />,
    );
    const btn = screen.getByTestId('checkout-confirm-Tarjeta-submit');
    expect(btn.textContent).toContain('Cobro confirmado');
  });
});
