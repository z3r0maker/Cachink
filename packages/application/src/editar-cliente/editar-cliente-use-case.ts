/**
 * EditarClienteUseCase (N-16) — applies a partial patch to an existing
 * cliente, mirroring `EditarProductoUseCase`: re-validate the merged row with
 * the domain schema at the boundary, delegate persistence to the repository.
 *
 * The portal import uses it to overwrite telefono/rfc on a matched row; the
 * identity fields an import matched on (nombre, or the teléfono itself) are
 * simply not part of that patch.
 */

import { ClientNotFoundError, ClientSchema, type Client, type ClientId } from '@xangarro/domain';
import type { ClientPatch, ClientsRepository } from '@xangarro/data';

import type { UseCase } from '../_use-case.js';

export interface EditarClienteInput {
  readonly id: ClientId;
  readonly patch: ClientPatch;
}

export class EditarClienteUseCase implements UseCase<EditarClienteInput, Client> {
  readonly #clients: ClientsRepository;

  constructor(clients: ClientsRepository) {
    this.#clients = clients;
  }

  async execute(input: EditarClienteInput): Promise<Client> {
    const existing = await this.#clients.findById(input.id);
    if (!existing) {
      throw new ClientNotFoundError(input.id);
    }
    const merged = { ...existing, ...input.patch };
    ClientSchema.parse(merged);
    const updated = await this.#clients.update(input.id, input.patch);
    if (!updated) {
      throw new ClientNotFoundError(input.id);
    }
    return updated;
  }
}
