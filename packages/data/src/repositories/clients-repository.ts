/**
 * ClientsRepository — minimal CRM. Powers the Crédito flow + Cuentas por
 * Cobrar (CLAUDE.md §1). `findByName` does a case-insensitive LIKE so
 * the Venta form can autocomplete.
 */

import type { BusinessId, Client, ClientId, NewClient } from '@cachink/domain';

export type { Client, NewClient };

export interface ClientsRepository {
  create(input: NewClient): Promise<Client>;
  findById(id: ClientId): Promise<Client | null>;
  /** LIKE %query% against nombre, scoped to the business, excludes deleted. */
  findByName(query: string, businessId: BusinessId): Promise<readonly Client[]>;
  delete(id: ClientId): Promise<void>;
}
