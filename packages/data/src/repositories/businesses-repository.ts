/**
 * BusinessesRepository — root tenant CRUD. Each device holds exactly one
 * business in Phase 1 but the repo signature already supports multiple so
 * the Director Settings screen can let users add a second business later
 * without a migration.
 */

import type { Business, BusinessId, NewBusiness } from '@cachink/domain';

export type { Business, NewBusiness };

/** Patchable fields for an existing Business (Settings edit flow). */
export type BusinessPatch = Partial<Pick<Business, 'nombre' | 'regimenFiscal' | 'isrTasa' | 'featureFlags'>>;

export interface BusinessesRepository {
  create(input: NewBusiness): Promise<Business>;
  findById(id: BusinessId): Promise<Business | null>;
  /** Look up the current business; composition root uses this to bootstrap. */
  findCurrent(id: BusinessId): Promise<Business | null>;
  /** Patch editable fields + advance `updatedAt`. Returns the updated row. */
  update(id: BusinessId, patch: BusinessPatch): Promise<Business>;
  delete(id: BusinessId): Promise<void>;
}
