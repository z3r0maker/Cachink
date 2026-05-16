/**
 * useCart — ephemeral tap-to-cart state for the Ventas and Merma screens.
 *
 * Pure client-side `useReducer` — no persistence, no sync. The cart
 * accumulates items from product taps; on checkout the route loops
 * through items and records each as a separate Sale/MovimientoInventario
 * (preserving the current "one cart item → one domain record" model).
 *
 * Shared between Ventas (prices matter) and Merma (all prices are 0n).
 */
import { useCallback, useMemo, useReducer } from 'react';
import type { Money } from '@cachink/domain';
import type { Product } from '@cachink/domain';
import type { ProductId } from '@cachink/domain';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface CartItem {
  readonly productoId: ProductId;
  readonly nombre: string;
  readonly precioUnitCentavos: Money;
  readonly cantidad: number;
  /** Enhancement H: snapshot of current stock at add time. */
  readonly stock?: number;
}

export interface CartState {
  readonly items: readonly CartItem[];
  readonly totalCentavos: Money;
  readonly itemCount: number;
}

export type CartAction =
  | { readonly type: 'add'; readonly product: Product; readonly stock?: number }
  | { readonly type: 'remove'; readonly productoId: ProductId }
  | { readonly type: 'removeAll'; readonly productoId: ProductId }
  | { readonly type: 'clear' }
  | { readonly type: 'updateStock'; readonly stockMap: ReadonlyMap<string, number> };

// ---------------------------------------------------------------------------
// Reducer helpers
// ---------------------------------------------------------------------------

const EMPTY_STATE: CartState = {
  items: [],
  totalCentavos: 0n,
  itemCount: 0,
};

function recompute(items: readonly CartItem[]): CartState {
  let total = 0n;
  let count = 0;
  for (const item of items) {
    total += item.precioUnitCentavos * BigInt(item.cantidad);
    count += item.cantidad;
  }
  return { items, totalCentavos: total, itemCount: count };
}

function addItem(
  state: CartState,
  product: Product,
  stock?: number,
): CartState {
  const idx = state.items.findIndex((i) => i.productoId === product.id);
  if (idx >= 0) {
    const prev = state.items[idx]!;
    const next: CartItem = { ...prev, cantidad: prev.cantidad + 1 };
    const items = state.items.map((item, i) => (i === idx ? next : item));
    return recompute(items);
  }
  const newItem: CartItem = {
    productoId: product.id,
    nombre: product.nombre,
    precioUnitCentavos: product.precioVentaCentavos,
    cantidad: 1,
    stock,
  };
  return recompute([...state.items, newItem]);
}

function removeOne(state: CartState, productoId: ProductId): CartState {
  const idx = state.items.findIndex((i) => i.productoId === productoId);
  if (idx < 0) return state;
  const prev = state.items[idx]!;
  if (prev.cantidad <= 1) {
    return recompute(state.items.filter((_, i) => i !== idx));
  }
  const next: CartItem = { ...prev, cantidad: prev.cantidad - 1 };
  return recompute(state.items.map((item, i) => (i === idx ? next : item)));
}

function removeAll(state: CartState, productoId: ProductId): CartState {
  const filtered = state.items.filter((i) => i.productoId !== productoId);
  if (filtered.length === state.items.length) return state;
  return recompute(filtered);
}

function updateStock(
  state: CartState,
  stockMap: ReadonlyMap<string, number>,
): CartState {
  const items = state.items.map((item) => {
    const s = stockMap.get(item.productoId);
    return s !== undefined ? { ...item, stock: s } : item;
  });
  return { ...state, items };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add':
      return addItem(state, action.product, action.stock);
    case 'remove':
      return removeOne(state, action.productoId);
    case 'removeAll':
      return removeAll(state, action.productoId);
    case 'clear':
      return EMPTY_STATE;
    case 'updateStock':
      return updateStock(state, action.stockMap);
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseCartReturn {
  readonly state: CartState;
  readonly dispatch: React.Dispatch<CartAction>;
  /** O(1) lookup — how many of this product are in the cart? */
  readonly getQuantity: (productoId: ProductId) => number;
}

export function useCart(): UseCartReturn {
  const [state, dispatch] = useReducer(cartReducer, EMPTY_STATE);

  const qtyMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const item of state.items) {
      m.set(item.productoId, item.cantidad);
    }
    return m;
  }, [state.items]);

  const getQuantity = useCallback(
    (productoId: ProductId): number => qtyMap.get(productoId) ?? 0,
    [qtyMap],
  );

  return { state, dispatch, getQuantity };
}
