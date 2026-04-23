/**
 * Branded ULID types per ADR-010 (ARCHITECTURE.md).
 *
 * ULIDs are lexicographically sortable by creation time, collision-safe
 * across devices (important for offline operation), and have established
 * tooling. Each entity gets its own branded type so the type system
 * prevents accidentally passing a SaleId where a ProductId is expected.
 */

import { ulid } from 'ulid';

/** Generic ULID string, 26 characters. Not usable directly — use a branded type below. */
export type Ulid = string & { readonly __brand: 'Ulid' };

/** Create a fresh ULID string. */
export function newUlid(): Ulid {
  return ulid() as Ulid;
}

// Branded per-entity types. Each is a Ulid tagged with its entity name so
// the compiler distinguishes them at assignment sites.
export type BusinessId = Ulid & { readonly __entity: 'Business' };
export type SaleId = Ulid & { readonly __entity: 'Sale' };
export type ExpenseId = Ulid & { readonly __entity: 'Expense' };
export type ProductId = Ulid & { readonly __entity: 'Product' };
export type InventoryMovementId = Ulid & { readonly __entity: 'InventoryMovement' };
export type EmployeeId = Ulid & { readonly __entity: 'Employee' };
export type ClientId = Ulid & { readonly __entity: 'Client' };
export type ClientPaymentId = Ulid & { readonly __entity: 'ClientPayment' };
export type DayCloseId = Ulid & { readonly __entity: 'DayClose' };
export type RecurringExpenseId = Ulid & { readonly __entity: 'RecurringExpense' };
export type DeviceId = Ulid & { readonly __entity: 'Device' };

/** Convenience factory for any branded entity id. */
export function newEntityId<T extends Ulid>(): T {
  return newUlid() as T;
}
