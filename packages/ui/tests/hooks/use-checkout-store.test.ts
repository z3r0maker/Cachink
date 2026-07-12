/**
 * useCheckoutStore tests — Zustand store for checkout state.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCheckoutStore } from '../../src/hooks/use-checkout-store';
import type { CartState } from '../../src/hooks/use-cart';

const FAKE_CART: CartState = {
  items: [
    {
      productoId: 'prod-1',
      nombre: 'Taco',
      precioUnitarioCentavos: 2500n,
      cantidad: 2,
      totalCentavos: 5000n,
    },
  ],
  totalCentavos: 5000n,
  itemCount: 2,
} as CartState;

describe('useCheckoutStore', () => {
  beforeEach(() => {
    useCheckoutStore.getState().clear();
  });

  it('starts with null cart', () => {
    expect(useCheckoutStore.getState().cart).toBeNull();
  });

  it('setCart stores the cart snapshot', () => {
    useCheckoutStore.getState().setCart(FAKE_CART);
    expect(useCheckoutStore.getState().cart).toBe(FAKE_CART);
  });

  it('clear resets cart to null', () => {
    useCheckoutStore.getState().setCart(FAKE_CART);
    useCheckoutStore.getState().clear();
    expect(useCheckoutStore.getState().cart).toBeNull();
  });
});
