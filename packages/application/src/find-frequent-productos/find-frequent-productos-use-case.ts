/**
 * FindFrequentProductosUseCase (UXD-R3 C1).
 *
 * Wraps the `SalesRepository.findFrequentProductoIds` query with a
 * 14-day lookback default. When no ventas exist in the lookback window
 * (cold start), falls back to the newest productos by `created_at`.
 */

import type { BusinessId, Product } from '@cachink/domain';
import type { ProductsRepository, SalesRepository } from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export interface FindFrequentProductosInput {
  readonly businessId: BusinessId;
  readonly limit?: number;
  readonly days?: number;
}

export class FindFrequentProductosUseCase
  implements UseCase<FindFrequentProductosInput, readonly Product[]>
{
  readonly #sales: SalesRepository;
  readonly #products: ProductsRepository;

  constructor(sales: SalesRepository, products: ProductsRepository) {
    this.#sales = sales;
    this.#products = products;
  }

  async execute(input: FindFrequentProductosInput): Promise<readonly Product[]> {
    const limit = input.limit ?? 6;
    const days = input.days ?? 14;
    const since = this.#daysAgo(days);

    const frequent = await this.#sales.findFrequentProductoIds({
      businessId: input.businessId,
      since,
      limit,
    });

    if (frequent.length > 0) {
      return this.#resolveProducts(frequent.map((f) => f.productoId));
    }

    return this.#fallbackNewest(input.businessId, limit);
  }

  async #resolveProducts(ids: readonly string[]): Promise<readonly Product[]> {
    const results: Product[] = [];
    for (const id of ids) {
      const p = await this.#products.findById(id as never);
      if (p) results.push(p);
    }
    return results;
  }

  async #fallbackNewest(
    businessId: BusinessId,
    limit: number,
  ): Promise<readonly Product[]> {
    const all = await this.#products.listForBusiness(businessId);
    return [...all]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  #daysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }
}
