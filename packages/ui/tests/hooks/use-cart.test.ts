/**
 * useCart hook + cartReducer tests.
 *
 * Pure state-machine tests — no render, no providers, no async. The
 * reducer is extracted conceptually via `useReducer`; we test via
 * `renderHook` for the hook's public API + a direct reducer import for
 * edge-case coverage.
 */
import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ProductId, Money } from '@cachink/domain';
import type { Product } from '@cachink/domain';
import { useCart, type CartItem } from '../../src/hooks/use-cart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeProduct(overrides: Partial<Product> & { id: string; nombre: string }): Product {
  return {
    id: overrides.id as ProductId,
    nombre: overrides.nombre,
    sku: null,
    categoria: 'alimentos',
    costoUnitCentavos: overrides.costoUnitCentavos ?? 1000n,
    unidad: 'pieza',
    umbralStockBajo: 3,
    tipo: 'producto',
    seguirStock: true,
    precioVentaCentavos: overrides.precioVentaCentavos ?? 2500n,
    atributos: {},
    colorFondo: 'white',
    usoProducto: 'venta',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'test',
    updatedBy: 'test',
    businessId: 'biz1',
  } as unknown as Product;
}

const TACO = fakeProduct({
  id: 'prod-taco',
  nombre: 'Taco al Pastor',
  precioVentaCentavos: 2500n,
});

const AGUA = fakeProduct({
  id: 'prod-agua',
  nombre: 'Agua de Horchata',
  precioVentaCentavos: 1500n,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCart', () => {
  it('starts with an empty cart', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.state.items).toHaveLength(0);
    expect(result.current.state.totalCentavos).toBe(0n);
    expect(result.current.state.itemCount).toBe(0);
  });

  it('adds a product to the cart', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.dispatch({ type: 'add', product: TACO }));
    expect(result.current.state.items).toHaveLength(1);
    expect(result.current.state.items[0]!.productoId).toBe('prod-taco');
    expect(result.current.state.items[0]!.cantidad).toBe(1);
    expect(result.current.state.totalCentavos).toBe(2500n);
    expect(result.current.state.itemCount).toBe(1);
  });

  it('increments quantity when same product added again', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.dispatch({ type: 'add', product: TACO });
      result.current.dispatch({ type: 'add', product: TACO });
      result.current.dispatch({ type: 'add', product: TACO });
    });
    expect(result.current.state.items).toHaveLength(1);
    expect(result.current.state.items[0]!.cantidad).toBe(3);
    expect(result.current.state.totalCentavos).toBe(7500n);
    expect(result.current.state.itemCount).toBe(3);
  });

  it('tracks multiple products independently', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.dispatch({ type: 'add', product: TACO });
      result.current.dispatch({ type: 'add', product: AGUA });
      result.current.dispatch({ type: 'add', product: TACO });
    });
    expect(result.current.state.items).toHaveLength(2);
    expect(result.current.state.totalCentavos).toBe(2500n + 1500n + 2500n);
    expect(result.current.state.itemCount).toBe(3);
  });

  it('removes one unit from a cart item', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.dispatch({ type: 'add', product: TACO });
      result.current.dispatch({ type: 'add', product: TACO });
    });
    act(() => {
      result.current.dispatch({ type: 'remove', productoId: 'prod-taco' as ProductId });
    });
    expect(result.current.state.items[0]!.cantidad).toBe(1);
    expect(result.current.state.totalCentavos).toBe(2500n);
  });

  it('removes item entirely when quantity reaches zero', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.dispatch({ type: 'add', product: TACO }));
    act(() => result.current.dispatch({ type: 'remove', productoId: 'prod-taco' as ProductId }));
    expect(result.current.state.items).toHaveLength(0);
    expect(result.current.state.totalCentavos).toBe(0n);
  });

  it('removeAll removes product regardless of quantity', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.dispatch({ type: 'add', product: TACO });
      result.current.dispatch({ type: 'add', product: TACO });
      result.current.dispatch({ type: 'add', product: TACO });
      result.current.dispatch({ type: 'add', product: AGUA });
    });
    act(() => {
      result.current.dispatch({ type: 'removeAll', productoId: 'prod-taco' as ProductId });
    });
    expect(result.current.state.items).toHaveLength(1);
    expect(result.current.state.items[0]!.productoId).toBe('prod-agua');
    expect(result.current.state.totalCentavos).toBe(1500n);
  });

  it('clear empties the entire cart', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.dispatch({ type: 'add', product: TACO });
      result.current.dispatch({ type: 'add', product: AGUA });
    });
    act(() => result.current.dispatch({ type: 'clear' }));
    expect(result.current.state.items).toHaveLength(0);
    expect(result.current.state.totalCentavos).toBe(0n);
    expect(result.current.state.itemCount).toBe(0);
  });

  it('remove from empty cart is a no-op', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.dispatch({ type: 'remove', productoId: 'non-existent' as ProductId });
    });
    expect(result.current.state.items).toHaveLength(0);
  });

  it('removeAll for non-existent product is a no-op', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.dispatch({ type: 'add', product: TACO }));
    act(() => {
      result.current.dispatch({ type: 'removeAll', productoId: 'non-existent' as ProductId });
    });
    expect(result.current.state.items).toHaveLength(1);
  });

  it('preserves stock on add (Enhancement H)', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.dispatch({ type: 'add', product: TACO, stock: 50 }));
    expect(result.current.state.items[0]!.stock).toBe(50);
  });

  it('updateStock refreshes stock values for existing items', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.dispatch({ type: 'add', product: TACO, stock: 50 });
      result.current.dispatch({ type: 'add', product: AGUA, stock: 20 });
    });
    const stockMap = new Map<string, number>([
      ['prod-taco', 47],
      ['prod-agua', 18],
    ]);
    act(() => result.current.dispatch({ type: 'updateStock', stockMap }));
    expect(result.current.state.items[0]!.stock).toBe(47);
    expect(result.current.state.items[1]!.stock).toBe(18);
  });

  it('getQuantity returns correct count', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.dispatch({ type: 'add', product: TACO });
      result.current.dispatch({ type: 'add', product: TACO });
    });
    expect(result.current.getQuantity('prod-taco' as ProductId)).toBe(2);
    expect(result.current.getQuantity('prod-agua' as ProductId)).toBe(0);
  });
});
