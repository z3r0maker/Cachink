/**
 * Create a cliente (N-16) — the portal import's and any future portal form's
 * one path. Mirrors `CrearProductoUseCase`: the domain schema is the only
 * validator, and the repository is the caller's (SQLite on the phone one day,
 * Postgres in the portal today).
 */

import { ClientInvalidError, NewClientSchema, type Client } from '@xangarro/domain';
import type { ClientsRepository } from '@xangarro/data';
import type { z } from 'zod';

import type { UseCase } from '../_use-case.js';

export interface CrearClienteInput {
  /** The domain's new-client shape; telefono/email/nota/rfc may be omitted. */
  readonly client: z.input<typeof NewClientSchema>;
}

export class CrearClienteUseCase implements UseCase<CrearClienteInput, Client> {
  constructor(private readonly clients: Pick<ClientsRepository, 'create'>) {}

  async execute(input: CrearClienteInput): Promise<Client> {
    const nombre = input.client.nombre?.trim();
    const parsed = NewClientSchema.safeParse({ ...input.client, nombre });
    if (!parsed.success) {
      throw new ClientInvalidError(parsed.error.issues.map((i) => i.path.join('.')));
    }
    return this.clients.create(parsed.data);
  }
}
