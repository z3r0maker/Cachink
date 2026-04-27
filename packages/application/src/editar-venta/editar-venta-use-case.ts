/**
 * EditarVentaUseCase (Audit Round 2 J1) — applies a partial patch to
 * an existing Sale.
 *
 * Responsibilities:
 *   1. Re-validate the patch fields with Zod at the boundary
 *      (defence-in-depth — UI may have skipped).
 *   2. Enforce the same Crédito invariant the create-side use-case
 *      enforces: when the patched `metodo` is `'Crédito'`, the row's
 *      `clienteId` (existing or supplied) must point at a real
 *      cliente.
 *   3. Delegate persistence to SalesRepository.update().
 *
 * Returns the updated Sale, or throws when the row no longer exists
 * (deleted between list-tap and edit-submit). Callers must handle
 * the race.
 */

import { SaleSchema, type Sale, type SaleId } from '@cachink/domain';
import type { ClientsRepository, SalePatch, SalesRepository } from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export interface EditarVentaInput {
  readonly id: SaleId;
  readonly patch: SalePatch;
}

export class EditarVentaUseCase implements UseCase<EditarVentaInput, Sale> {
  readonly #sales: SalesRepository;
  readonly #clients: ClientsRepository;

  constructor(sales: SalesRepository, clients: ClientsRepository) {
    this.#sales = sales;
    this.#clients = clients;
  }

  async execute(input: EditarVentaInput): Promise<Sale> {
    const existing = await this.#sales.findById(input.id);
    if (!existing) {
      throw new TypeError(`Venta ${input.id} no existe o fue eliminada`);
    }
    const merged = { ...existing, ...input.patch };
    // Re-validate the merged shape — guards against patches that
    // would push the row into an invalid state (e.g. `concepto: ""`).
    SaleSchema.parse(merged);
    if (merged.metodo === 'Crédito') {
      if (!merged.clienteId) {
        throw new TypeError('Venta en Crédito requiere clienteId');
      }
      const cliente = await this.#clients.findById(merged.clienteId);
      if (!cliente) {
        throw new TypeError(`Cliente ${merged.clienteId} no existe`);
      }
    }
    const updated = await this.#sales.update(input.id, input.patch);
    if (!updated) {
      throw new TypeError(`Venta ${input.id} desapareció durante la actualización`);
    }
    return updated;
  }
}
