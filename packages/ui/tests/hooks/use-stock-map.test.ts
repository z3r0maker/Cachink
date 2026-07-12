/**
 * useStockMap tests — pure computation, no providers needed.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStockMap } from '../../src/hooks/use-stock-map';

describe('useStockMap', () => {
  it('returns empty map when data is undefined', () => {
    const { result } = renderHook(() => useStockMap({}));
    expect(result.current.size).toBe(0);
  });

  it('returns empty map for empty array', () => {
    const { result } = renderHook(() => useStockMap({ data: [] }));
    expect(result.current.size).toBe(0);
  });

  it('maps productId to stock quantity', () => {
    const data = [
      { producto: { id: 'prod-1' }, stock: 10 },
      { producto: { id: 'prod-2' }, stock: 5 },
      { producto: { id: 'prod-3' }, stock: 0 },
    ];
    const { result } = renderHook(() => useStockMap({ data }));
    expect(result.current.get('prod-1')).toBe(10);
    expect(result.current.get('prod-2')).toBe(5);
    expect(result.current.get('prod-3')).toBe(0);
    expect(result.current.size).toBe(3);
  });

  it('returns undefined for unknown product', () => {
    const data = [{ producto: { id: 'prod-1' }, stock: 10 }];
    const { result } = renderHook(() => useStockMap({ data }));
    expect(result.current.get('unknown')).toBeUndefined();
  });
});
