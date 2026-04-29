/**
 * RegistrarVentaUseCase — records a Venta.
 *
 * Responsibilities:
 *   1. Re-validate the NewSale input with Zod at the boundary.
 *   2. Enforce the Crédito invariant: clienteId is required AND the
 *      cliente must exist.
 *   3. Validate that the referenced producto exists (ADR-048).
 *   4. Delegate persistence to SalesRepository.create().
 *   5. When the producto has `seguirStock=true`, auto-create a salida
 *      MovimientoInventario with `cantidad` units.
 */

import { NewSaleSchema, today, type NewSale, type Sale } from '@cachink/domain';
import type {
  ClientsRepository,
  InventoryMovementsRepository,
  ProductsRepository,
  SalesRepository,
} from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export class RegistrarVentaUseCase implements UseCase<NewSale, Sale> {
  readonly #sales: SalesRepository;
  readonly #clients: ClientsRepository;
  readonly #products: ProductsRepository;
  readonly #movements: InventoryMovementsRepository;

  constructor(
    sales: SalesRepository,
    clients: ClientsRepository,
    products: ProductsRepository,
    movements: InventoryMovementsRepository,
  ) {
    this.#sales = sales;
    this.#clients = clients;
    this.#products = products;
    this.#movements = movements;
  }

  async execute(input: NewSale): Promise<Sale> {
    const parsed = NewSaleSchema.parse(input);

    // Every sale must reference an existing product (ADR-048)
    const producto = await this.#products.findById(parsed.productoId);
    if (!producto) {
      throw new TypeError(`Producto ${parsed.productoId} no existe`);
    }

    // Crédito invariant
    if (parsed.metodo === 'Crédito') {
      if (!parsed.clienteId) {
        throw new TypeError('Venta en Crédito requiere clienteId');
      }
      const cliente = await this.#clients.findById(parsed.clienteId);
      if (!cliente) {
        throw new TypeError(`Cliente ${parsed.clienteId} no existe`);
      }
    }

    const sale = await this.#sales.create(parsed);

    // Auto-stock salida — productoId always present, just check seguirStock
    if (producto.seguirStock) {
      await this.#movements.create({
        productoId: parsed.productoId,
        fecha: parsed.fecha ?? today(),
        tipo: 'salida',
        cantidad: parsed.cantidad ?? 1,
        costoUnitCentavos: producto.costoUnitCentavos,
        motivo: 'Venta',
        nota: undefined,
        businessId: parsed.businessId,
      });
    }

    return sale;
  }
}
