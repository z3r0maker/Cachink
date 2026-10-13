/**
 * useCheckoutStore — tiny Zustand store for checkout state.
 *
 * Survives navigation from /ventas → /checkout → /checkout/efectivo
 * without needing to serialize cart data through route params.
 * Cleared after successful checkout, same as the old modal flow.
 */

import { create } from 'zustand';
import type { CartState } from './use-cart';

interface CheckoutStore {
  /** Cart snapshot at time of "Cobrar" tap. */
  readonly cart: CartState | null;
  /** Set the cart for checkout. */
  readonly setCart: (cart: CartState) => void;
  /** Clear after successful checkout. */
  readonly clear: () => void;
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  cart: null,
  setCart: (cart) => set({ cart }),
  clear: () => set({ cart: null }),
}));
