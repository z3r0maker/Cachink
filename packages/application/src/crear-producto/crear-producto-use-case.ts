/**
 * Create a product (P-07) — the phone's and the portal's one path.
 *
 * The phone used to do this in a UI hook; the rules now live here so both
 * clients apply the same defaults and checks (CLAUDE.md §2.3).
 *
 * Initial stock is an entrada movement at the product's cost, and only a
 * caller that can record movements may ask for it. The phone passes its
 * movements store; the portal passes none, because the owner decided portal
 * products start at zero and stock is added with a movement (ADR-081).
 */

import {
  InitialStockNotAllowedError,
  NewProductSchema,
  ProductInvalidError,
  type IsoDate,
  type Product,
} from '@xangarro/domain';
import type { InventoryMovementsRepository, ProductsRepository } from '@xangarro/data';
import type { InventoryMovement } from '@xangarro/domain';
import type { z } from 'zod';

import type { UseCase } from '../_use-case.js';

export interface CrearProductoInput {
  /** The domain's new-product shape; defaults (tipo, seguirStock, color…) may be omitted. */
  readonly product: z.input<typeof NewProductSchema>;
  readonly stockInicial?: number;
  /** The entrada's date; today (local) when omitted. */
  readonly today?: IsoDate;
}

const localToday = (): IsoDate => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` as IsoDate;
};

export class CrearProductoUseCase implements UseCase<CrearProductoInput, Product> {
  constructor(
    private readonly products: Pick<ProductsRepository, 'create'>,
    private readonly movements?: Pick<InventoryMovementsRepository, 'create'>,
    /** Whose opening stock this is: the portal's (owner) or a phone's (C-12). */
    private readonly origen: InventoryMovement['origen'] = 'manual',
  ) {}

  async execute(input: CrearProductoInput): Promise<Product> {
    const stock = input.stockInicial ?? 0;
    if (!Number.isInteger(stock) || stock < 0) throw new ProductInvalidError(['stockInicial']);
    if (stock > 0 && this.movements === undefined) throw new InitialStockNotAllowedError();

    const sku = input.product.sku?.trim();
    const parsed = NewProductSchema.safeParse({ ...input.product, sku: sku || undefined });
    if (!parsed.success) {
      throw new ProductInvalidError(parsed.error.issues.map((i) => i.path.join('.')));
    }
    const product = await this.products.create(parsed.data);
    if (stock > 0 && this.movements !== undefined) {
      await this.movements.create({
        productoId: product.id,
        fecha: input.today ?? localToday(),
        tipo: 'entrada',
        cantidad: stock,
        costoUnitCentavos: parsed.data.costoUnitCentavos,
        origen: this.origen,
        motivo: 'Ajuste de inventario',
        businessId: parsed.data.businessId,
      });
    }
    return product;
  }
}
