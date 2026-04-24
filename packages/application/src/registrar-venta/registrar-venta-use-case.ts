/**
 * RegistrarVentaUseCase (P1B-M6-T01) — records a Venta.
 *
 * Responsibilities:
 *   1. Re-validate the NewSale input with Zod at the boundary
 *      (defence-in-depth; UI may have skipped).
 *   2. Enforce the Crédito invariant: clienteId is required AND the
 *      cliente must exist.
 *   3. Delegate persistence to SalesRepository.create().
 *
 * The repository handles estadoPago defaulting (pagado for cash / card /
 * transfer / QR; pendiente for Crédito) per the P1B-M4 contract, so we
 * don't duplicate that here.
 */

import { NewSaleSchema, type NewSale, type Sale } from '@cachink/domain';
import type { ClientsRepository, SalesRepository } from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export class RegistrarVentaUseCase implements UseCase<NewSale, Sale> {
  readonly #sales: SalesRepository;
  readonly #clients: ClientsRepository;

  constructor(sales: SalesRepository, clients: ClientsRepository) {
    this.#sales = sales;
    this.#clients = clients;
  }

  async execute(input: NewSale): Promise<Sale> {
    const parsed = NewSaleSchema.parse(input);
    if (parsed.metodo === 'Crédito') {
      if (!parsed.clienteId) {
        throw new TypeError('Venta en Crédito requiere clienteId');
      }
      const cliente = await this.#clients.findById(parsed.clienteId);
      if (!cliente) {
        throw new TypeError(`Cliente ${parsed.clienteId} no existe`);
      }
    }
    return this.#sales.create(parsed);
  }
}
