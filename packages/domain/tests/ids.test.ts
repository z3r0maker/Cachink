import { describe, it, expect } from 'vitest';
import { newUlid, newEntityId, type SaleId, type ProductId } from '../src/ids/index.js';

describe('IDs', () => {
  it('generates a valid 26-character ULID', () => {
    const id = newUlid();
    expect(id).toHaveLength(26);
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('generates unique IDs on successive calls', () => {
    const ids = Array.from({ length: 100 }, () => newUlid());
    const unique = new Set(ids);
    expect(unique.size).toBe(100);
  });

  it('sorts lexicographically by time of creation', async () => {
    const first = newUlid();
    // Force a time gap so the second ULID has a strictly later timestamp component.
    await new Promise((resolve) => setTimeout(resolve, 2));
    const second = newUlid();
    expect(second > first).toBe(true);
  });

  it('creates branded entity ids via newEntityId', () => {
    const saleId: SaleId = newEntityId<SaleId>();
    const productId: ProductId = newEntityId<ProductId>();
    expect(saleId).toHaveLength(26);
    expect(productId).toHaveLength(26);
    // Compile-time guarantee: the types are distinct. At runtime both are strings.
    expect(typeof saleId).toBe('string');
  });
});
