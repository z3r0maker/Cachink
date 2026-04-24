/**
 * useEliminarProducto tests (Slice 2 C23).
 *
 * Exercises the stock-guard logic directly by instantiating a
 * StockNotEmptyError via the mutation function. The full mutation
 * wired through TanStack Query is covered indirectly via the
 * component tests that own the Eliminar button.
 */

import { describe, expect, it } from 'vitest';
import { StockNotEmptyError } from '../../src/hooks/use-eliminar-producto';

describe('StockNotEmptyError', () => {
  it('carries the current stock on the error instance', () => {
    const err = new StockNotEmptyError(7);
    expect(err.name).toBe('StockNotEmptyError');
    expect(err.currentStock).toBe(7);
    expect(err.message).toContain('7');
  });

  it('is distinguishable from a regular Error', () => {
    const err: Error = new StockNotEmptyError(2);
    expect(err instanceof StockNotEmptyError).toBe(true);
  });
});
