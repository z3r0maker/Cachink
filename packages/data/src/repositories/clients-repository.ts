/**
 * ClientsRepository — minimal CRM. Powers the Crédito flow + Cuentas por
 * Cobrar (CLAUDE.md §1). `findByName` does a case-insensitive LIKE so
 * the Venta form can autocomplete.
 */

import type { BusinessId, Client, ClientId, NewClient } from '@cachink/domain';

export type { Client, NewClient };

/**
 * Partial-patch shape for `update()` per ADR-023. Immutable audit
 * fields (id, businessId, deviceId, createdAt) are excluded; the impl
 * bumps `updatedAt` internally.
 */
export type ClientPatch = Partial<Pick<Client, 'nombre' | 'telefono' | 'email' | 'nota'>>;

export interface ClientsRepository {
  create(input: NewClient): Promise<Client>;
  findById(id: ClientId): Promise<Client | null>;
  /** LIKE %query% against nombre, scoped to the business, excludes deleted. */
  findByName(query: string, businessId: BusinessId): Promise<readonly Client[]>;
  /** Partial update per ADR-023. Returns the post-update row or null when not found. */
  update(id: ClientId, patch: ClientPatch): Promise<Client | null>;
  delete(id: ClientId): Promise<void>;
}
